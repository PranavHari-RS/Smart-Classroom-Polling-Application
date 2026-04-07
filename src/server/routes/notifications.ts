import express from 'express';
import db from '../db.js';
import { authenticateToken, AuthRequest } from '../auth.js';

const router = express.Router();

// Get all notifications for the current user
router.get('/', authenticateToken, (req: AuthRequest, res) => {
  try {
    const notifications = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC').all(req.user!.id);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// IMPORTANT: This must come BEFORE /:id/read to avoid Express matching 'read-all' as an id
// Mark all notifications as read
router.put('/read-all', authenticateToken, (req: AuthRequest, res) => {
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user!.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

// Mark a single notification as read
router.put('/:id/read', authenticateToken, (req: AuthRequest, res) => {
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user!.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

export default router;
