import express from 'express';
import db from '../db.js';
import { authenticateToken, requireRole } from '../auth.js';

const router = express.Router();

// Get recent system activity (admin only)
router.get('/activity', authenticateToken, requireRole(['admin']), (req, res) => {
  try {
    const activity = db.prepare(`
      SELECT a.*, u.name as user_name, u.role as user_role
      FROM system_activity a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 50
    `).all();
    res.json(activity);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch activity log' });
  }
});

// Get platform-wide stats (admin only)
router.get('/stats', authenticateToken, requireRole(['admin']), (req, res) => {
  try {
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
    const quizCount = db.prepare('SELECT COUNT(*) as count FROM quizzes').get() as any;
    const attemptCount = db.prepare('SELECT COUNT(*) as count FROM quiz_attempts WHERE status = ?').get('submitted') as any;
    const classroomCount = db.prepare('SELECT COUNT(*) as count FROM classrooms').get() as any;

    const studentCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'student'").get() as any;
    const teacherCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'teacher'").get() as any;
    const activeQuizCount = db.prepare("SELECT COUNT(*) as count FROM quizzes WHERE status = 'active'").get() as any;

    res.json({
      users: userCount.count,
      quizzes: quizCount.count,
      attempts: attemptCount.count,
      classrooms: classroomCount.count,
      students: studentCount.count,
      teachers: teacherCount.count,
      activeQuizzes: activeQuizCount.count,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
