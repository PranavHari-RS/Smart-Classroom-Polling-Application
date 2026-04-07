import express from 'express';
import db from '../db.js';
import { authenticateToken, requireRole, AuthRequest } from '../auth.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

router.get('/', authenticateToken, requireRole(['admin', 'teacher']), (req: AuthRequest, res) => {
  const users = db.prepare('SELECT id, name, email, role, avatar FROM users').all();
  res.json(users);
});

router.post('/', authenticateToken, requireRole(['admin']), (req: AuthRequest, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) return res.status(400).json({ error: 'All fields required' });

  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(
      name, email, hashedPassword, role
    );
    res.status(201).json({ id: result.lastInsertRowid, name, email, role });
  } catch (err: any) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(400).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: 'Database error' });
    }
  }
});

router.delete('/:id', authenticateToken, requireRole(['admin']), (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
