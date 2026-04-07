import express from 'express';
import db from '../db.js';
import { authenticateToken, requireRole, AuthRequest } from '../auth.js';
import { GoogleGenAI, Type } from '@google/genai';

const router = express.Router();

// Get all quizzes (admin sees all, teacher sees theirs, student sees active/completed)
router.get('/', authenticateToken, (req: AuthRequest, res) => {
  const { role, id } = req.user!;
  let quizzes;
  
  if (role === 'admin') {
    quizzes = db.prepare('SELECT q.*, u.name as teacher_name FROM quizzes q JOIN users u ON q.teacher_id = u.id').all();
  } else if (role === 'teacher') {
    quizzes = db.prepare('SELECT * FROM quizzes WHERE teacher_id = ?').all(id);
  } else if (role === 'student') {
    // Students see published, active, completed quizzes for their classrooms
    quizzes = db.prepare(`
      SELECT q.*, u.name as teacher_name 
      FROM quizzes q 
      JOIN users u ON q.teacher_id = u.id 
      JOIN classroom_students cs ON q.classroom_id = cs.classroom_id
      WHERE q.status IN ('published', 'active', 'completed') AND cs.student_id = ?
    `).all(id);
  }
  
  res.json(quizzes);
});

// Get single quiz with questions
router.get('/:id', authenticateToken, (req: AuthRequest, res) => {
  const { id } = req.params;
  const quiz = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(id) as any;
  if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

  // Only teachers and admins can see questions before active
  if (req.user!.role === 'student' && quiz.status === 'draft') {
    return res.status(403).json({ error: 'Quiz not available' });
  }

  const questions = db.prepare('SELECT * FROM questions WHERE quiz_id = ?').all(id).map((q: any) => ({
    ...q,
    options: JSON.parse(q.options),
    correct_answers: req.user!.role === 'student' && quiz.status !== 'completed' ? [] : JSON.parse(q.correct_answers)
  }));

  res.json({ ...quiz, questions });
});

// Create a new quiz (Teacher/Admin)
router.post('/', authenticateToken, requireRole(['teacher', 'admin']), (req: AuthRequest, res) => {
  const { title, description, time_limit, difficulty, classroom_id, questions } = req.body;
  const teacher_id = req.user!.id;

  try {
    const insertQuiz = db.prepare('INSERT INTO quizzes (title, description, teacher_id, classroom_id, time_limit, difficulty) VALUES (?, ?, ?, ?, ?, ?)');
    const result = insertQuiz.run(title, description, teacher_id, classroom_id || null, time_limit, difficulty);
    const quizId = result.lastInsertRowid;

    // Log activity
    db.prepare('INSERT INTO system_activity (user_id, action, details) VALUES (?, ?, ?)').run(
      teacher_id, 'Quiz Created', `New quiz "${title}" created`
    );

    if (questions && questions.length > 0) {
      const insertQuestion = db.prepare('INSERT INTO questions (quiz_id, text, type, options, correct_answers, time_limit, points) VALUES (?, ?, ?, ?, ?, ?, ?)');
      
      const insertMany = db.transaction((qs: any[]) => {
        for (const q of qs) {
          insertQuestion.run(
            quizId, 
            q.text, 
            q.type || 'single', 
            JSON.stringify(q.options), 
            JSON.stringify(q.correct_answers),
            q.time_limit || null,
            q.points || 1
          );
        }
      });
      insertMany(questions);
    }

    res.status(201).json({ id: quizId, title });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create quiz' });
  }
});

// AI-powered quiz generation endpoint (Backend proxy to keep API key secure)
router.post('/generate-ai', authenticateToken, requireRole(['teacher', 'admin']), async (req: AuthRequest, res) => {
  const { topic, count = 5, difficulty = 'medium' } = req.body;

  if (!topic) {
    return res.status(400).json({ error: 'Topic is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'AI service is not configured (missing GEMINI_API_KEY)' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a quiz about "${topic}" at ${difficulty} difficulty. Include a catchy title, a short description, and ${count} multiple choice questions.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'A catchy title for the quiz' },
            description: { type: Type.STRING, description: 'A short description of the quiz' },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING, description: 'The question text' },
                  type: { type: Type.STRING, description: "Must be 'single' or 'multiple'" },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Array of 4 possible answers'
                  },
                  correct_answers: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Array of correct answers (must match strings in options exactly)'
                  }
                },
                required: ['text', 'type', 'options', 'correct_answers']
              }
            }
          },
          required: ['title', 'description', 'questions']
        }
      }
    });

    const data = JSON.parse(response.text || '{}');
    res.json(data);
  } catch (err: any) {
    console.error('AI generation error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate quiz with AI' });
  }
});

// Update quiz status
router.patch('/:id/status', authenticateToken, requireRole(['teacher', 'admin']), (req: AuthRequest, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!['draft', 'published', 'active', 'completed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const quiz = db.prepare('SELECT title, teacher_id, classroom_id FROM quizzes WHERE id = ?').get(id) as any;
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    db.prepare('UPDATE quizzes SET status = ? WHERE id = ?').run(status, id);

    // Log activity
    db.prepare('INSERT INTO system_activity (user_id, action, details) VALUES (?, ?, ?)').run(
      req.user!.id, 'Quiz Status Updated', `Quiz "${quiz.title}" is now ${status}`
    );

    // If quiz is published or active, notify students in the specific classroom
    if ((status === 'published' || status === 'active') && quiz.classroom_id) {
      const students = db.prepare(`
        SELECT student_id 
        FROM classroom_students 
        WHERE classroom_id = ?
      `).all(quiz.classroom_id) as any[];

      if (students.length > 0) {
        const insertNotification = db.prepare('INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)');
        const notifyTransaction = db.transaction(() => {
          for (const s of students) {
            insertNotification.run(
              s.student_id, 
              `Quiz ${status === 'active' ? 'Started' : 'Published'}`, 
              `The quiz "${quiz.title}" is now ${status}.`
            );
          }
        });
        notifyTransaction();
      }
    }

    res.json({ success: true, status });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Delete a quiz
router.delete('/:id', authenticateToken, requireRole(['teacher', 'admin']), (req: AuthRequest, res) => {
  const { id } = req.params;
  const { role, id: userId } = req.user!;

  try {
    const quiz = db.prepare('SELECT teacher_id FROM quizzes WHERE id = ?').get(id) as any;
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    if (role === 'teacher' && quiz.teacher_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    db.transaction(() => {
      db.prepare('DELETE FROM attempt_answers WHERE attempt_id IN (SELECT id FROM quiz_attempts WHERE quiz_id = ?)').run(id);
      db.prepare('DELETE FROM quiz_attempts WHERE quiz_id = ?').run(id);
      db.prepare('DELETE FROM questions WHERE quiz_id = ?').run(id);
      db.prepare('DELETE FROM quizzes WHERE id = ?').run(id);
    })();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete quiz' });
  }
});

export default router;
