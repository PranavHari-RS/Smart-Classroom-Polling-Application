import express from 'express';
import db from '../db.js';
import { authenticateToken, requireRole, AuthRequest } from '../auth.js';

const router = express.Router();

// Get all questions in the bank for a teacher
router.get('/bank', authenticateToken, requireRole(['teacher']), (req: AuthRequest, res) => {
  try {
    const questions = db.prepare('SELECT * FROM question_bank WHERE teacher_id = ?').all(req.user!.id);
    res.json(questions.map((q: any) => ({
      ...q,
      options: JSON.parse(q.options),
      correct_answers: JSON.parse(q.correct_answers)
    })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch question bank' });
  }
});

// Add a question to the bank
router.post('/bank', authenticateToken, requireRole(['teacher']), (req: AuthRequest, res) => {
  const { text, type, options, correct_answers, points } = req.body;
  
  if (!text || !type || !options || !correct_answers) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO question_bank (teacher_id, text, type, options, correct_answers, points) 
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      req.user!.id, 
      text, 
      type, 
      JSON.stringify(options), 
      JSON.stringify(correct_answers), 
      points || 1
    );
    
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add question to bank' });
  }
});

// Delete a question from the bank
router.delete('/bank/:id', authenticateToken, requireRole(['teacher']), (req: AuthRequest, res) => {
  try {
    const result = db.prepare('DELETE FROM question_bank WHERE id = ? AND teacher_id = ?').run(req.params.id, req.user!.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Question not found or unauthorized' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

export default router;
