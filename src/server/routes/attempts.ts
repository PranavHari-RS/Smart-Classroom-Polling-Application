import express from 'express';
import db from '../db.js';
import { authenticateToken, requireRole, AuthRequest } from '../auth.js';

const router = express.Router();

// Start a quiz attempt
router.post('/start', authenticateToken, requireRole(['student']), (req: AuthRequest, res) => {
  const { quiz_id } = req.body;
  const student_id = req.user!.id;

  const quiz = db.prepare('SELECT status, time_limit FROM quizzes WHERE id = ?').get(quiz_id) as any;
  if (!quiz || quiz.status !== 'active') {
    return res.status(400).json({ error: 'Quiz is not active' });
  }

  const existingAttempt = db.prepare('SELECT * FROM quiz_attempts WHERE quiz_id = ? AND student_id = ?').get(quiz_id, student_id) as any;
  if (existingAttempt) {
    if (existingAttempt.status === 'in_progress') {
      return res.json({ attempt_id: existingAttempt.id, start_time: existingAttempt.start_time });
    }
    return res.status(400).json({ error: 'Quiz already attempted' });
  }

  const start_time = new Date().toISOString();
  const result = db.prepare('INSERT INTO quiz_attempts (quiz_id, student_id, start_time, status) VALUES (?, ?, ?, ?)').run(
    quiz_id, student_id, start_time, 'in_progress'
  );

  res.json({ attempt_id: result.lastInsertRowid, start_time });
});

// Submit a quiz attempt
router.post('/:attempt_id/submit', authenticateToken, requireRole(['student']), (req: AuthRequest, res) => {
  const { attempt_id } = req.params;
  const { answers } = req.body; // { question_id: [selected_options] }
  const student_id = req.user!.id;

  const attempt = db.prepare('SELECT * FROM quiz_attempts WHERE id = ? AND student_id = ?').get(attempt_id, student_id) as any;
  if (!attempt || attempt.status !== 'in_progress') {
    return res.status(400).json({ error: 'Invalid or already submitted attempt' });
  }

  const quiz = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(attempt.quiz_id) as any;
  const questions = db.prepare('SELECT * FROM questions WHERE quiz_id = ?').all(attempt.quiz_id) as any[];

  let totalScore = 0;
  const end_time = new Date().toISOString();

  const insertAnswer = db.prepare('INSERT INTO attempt_answers (attempt_id, question_id, selected_options, is_correct, points_earned) VALUES (?, ?, ?, ?, ?)');
  
  const submitTransaction = db.transaction(() => {
    for (const q of questions) {
      const selected = answers[q.id] || [];
      const correct = JSON.parse(q.correct_answers);
      
      // Simple exact match for correctness
      const is_correct = selected.length === correct.length && selected.every((val: string) => correct.includes(val));
      const points_earned = is_correct ? q.points : 0;
      totalScore += points_earned;

      insertAnswer.run(attempt_id, q.id, JSON.stringify(selected), is_correct ? 1 : 0, points_earned);
    }

    db.prepare('UPDATE quiz_attempts SET end_time = ?, score = ?, status = ? WHERE id = ?').run(
      end_time, totalScore, 'submitted', attempt_id
    );

    // Gamification: Add XP and Level up
    const user = db.prepare('SELECT xp, level FROM users WHERE id = ?').get(student_id) as any;
    if (user) {
      const xpGained = totalScore * 10; // 10 XP per point
      let newXp = user.xp + xpGained;
      let newLevel = user.level;
      
      // Level up logic: 100 XP per level
      while (newXp >= newLevel * 100) {
        newXp -= newLevel * 100;
        newLevel++;
      }

      db.prepare('UPDATE users SET xp = ?, level = ? WHERE id = ?').run(newXp, newLevel, student_id);
    }
  });

  try {
    submitTransaction();
    res.json({ success: true, score: totalScore, total: questions.reduce((acc, q) => acc + q.points, 0) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
});

// Get leaderboard for a quiz
router.get('/quiz/:quiz_id/leaderboard', authenticateToken, (req: AuthRequest, res) => {
  const { quiz_id } = req.params;
  
  // Get the classroom for this quiz
  const quiz = db.prepare('SELECT classroom_id FROM quizzes WHERE id = ?').get(quiz_id) as any;
  
  if (!quiz || !quiz.classroom_id) {
    // Fallback if no classroom is associated
    const leaderboard = db.prepare(`
      SELECT u.name, u.avatar, qa.score, qa.start_time, qa.end_time
      FROM quiz_attempts qa
      JOIN users u ON qa.student_id = u.id
      WHERE qa.quiz_id = ? AND qa.status = 'submitted'
      ORDER BY qa.score DESC, qa.end_time ASC
    `).all(quiz_id);
    return res.json(leaderboard);
  }

  // Get all students in the classroom and their scores for this quiz
  const leaderboard = db.prepare(`
    SELECT 
      u.name, 
      u.avatar, 
      COALESCE(qa.score, 0) as score, 
      qa.start_time, 
      qa.end_time,
      qa.status
    FROM classroom_students cs
    JOIN users u ON cs.student_id = u.id
    LEFT JOIN quiz_attempts qa ON cs.student_id = qa.student_id AND qa.quiz_id = ? AND qa.status = 'submitted'
    WHERE cs.classroom_id = ?
    ORDER BY score DESC, qa.end_time ASC
  `).all(quiz_id, quiz.classroom_id);

  res.json(leaderboard);
});

// Get student's attempts
router.get('/my-attempts', authenticateToken, requireRole(['student']), (req: AuthRequest, res) => {
  const student_id = req.user!.id;
  const attempts = db.prepare(`
    SELECT qa.*, q.title, q.description
    FROM quiz_attempts qa
    JOIN quizzes q ON qa.quiz_id = q.id
    WHERE qa.student_id = ?
  `).all(student_id);
  res.json(attempts);
});

// Get student's quick stats
router.get('/stats', authenticateToken, requireRole(['student']), (req: AuthRequest, res) => {
  const student_id = req.user!.id;
  
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as completed,
      AVG(score * 100.0 / (SELECT SUM(points) FROM questions WHERE quiz_id = qa.quiz_id)) as average
    FROM quiz_attempts qa
    WHERE qa.student_id = ? AND qa.status = 'submitted'
  `).get(student_id) as any;

  // Calculate classroom rank
  const classroom = db.prepare('SELECT classroom_id FROM classroom_students WHERE student_id = ? LIMIT 1').get(student_id) as any;
  
  let rank = 0;
  if (classroom) {
    const classroom_id = classroom.classroom_id;
    
    // Get all students in this classroom and their total scores
    const leaderboard = db.prepare(`
      SELECT 
        cs.student_id,
        COALESCE(SUM(qa.score), 0) as total_score
      FROM classroom_students cs
      LEFT JOIN quiz_attempts qa ON cs.student_id = qa.student_id AND qa.status = 'submitted'
      WHERE cs.classroom_id = ?
      GROUP BY cs.student_id
      ORDER BY total_score DESC, cs.student_id ASC
    `).all(classroom_id) as any[];

    // Find the rank of the current student
    const studentRankIndex = leaderboard.findIndex(item => item.student_id === student_id);
    // Only show rank if the student has a score > 0, otherwise 0 as requested
    if (studentRankIndex !== -1 && leaderboard[studentRankIndex].total_score > 0) {
      rank = studentRankIndex + 1;
    }
  }

  res.json({
    completed: stats?.completed || 0,
    average: Math.round(stats?.average || 0),
    rank: rank
  });
});

// Get all attempts for a teacher's quizzes
router.get('/all', authenticateToken, requireRole(['teacher', 'admin']), (req: AuthRequest, res) => {
  try {
    const attempts = db.prepare(`
      SELECT qa.*, q.title, u.name as student_name
      FROM quiz_attempts qa
      JOIN quizzes q ON qa.quiz_id = q.id
      JOIN users u ON qa.student_id = u.id
      WHERE q.teacher_id = ?
      ORDER BY qa.end_time DESC
    `).all(req.user!.id);
    res.json(attempts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch attempts' });
  }
});

// Get detailed attempt result
router.get('/:attempt_id/result', authenticateToken, requireRole(['student', 'teacher']), (req: AuthRequest, res) => {
  const { attempt_id } = req.params;
  const user_id = req.user!.id;
  const role = req.user!.role;

  try {
    const attempt = db.prepare(`
      SELECT qa.*, q.title, q.description, q.time_limit, q.teacher_id
      FROM quiz_attempts qa
      JOIN quizzes q ON qa.quiz_id = q.id
      WHERE qa.id = ?
    `).get(attempt_id) as any;

    if (!attempt) {
      return res.status(404).json({ error: 'Attempt not found' });
    }

    // Check permissions
    if (role === 'student' && attempt.student_id !== user_id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    if (role === 'teacher' && attempt.teacher_id !== user_id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const questions = db.prepare('SELECT id, text, type, options, correct_answers, points FROM questions WHERE quiz_id = ?').all(attempt.quiz_id) as any[];
    const answers = db.prepare('SELECT question_id, selected_options, is_correct, points_earned FROM attempt_answers WHERE attempt_id = ?').all(attempt_id) as any[];

    const detailedResult = {
      ...attempt,
      questions: questions.map(q => {
        const answer = answers.find(a => a.question_id === q.id);
        return {
          ...q,
          options: JSON.parse(q.options),
          correct_answers: JSON.parse(q.correct_answers),
          user_answer: answer ? JSON.parse(answer.selected_options) : [],
          is_correct: answer ? Boolean(answer.is_correct) : false,
          points_earned: answer ? answer.points_earned : 0
        };
      })
    };

    res.json(detailedResult);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch result details' });
  }
});

export default router;
