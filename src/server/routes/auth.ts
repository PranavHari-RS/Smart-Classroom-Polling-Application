import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { generateToken, authenticateToken, AuthRequest } from '../auth.js';

const router = express.Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const validPassword = bcrypt.compareSync(password, user.password);
  if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

  const token = generateToken({ id: user.id, email: user.email, role: user.role });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, xp: user.xp, level: user.level } });
});

router.post('/register', (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) return res.status(400).json({ error: 'All fields required' });

  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(
      name, email, hashedPassword, role
    );
    
    // Log activity
    db.prepare('INSERT INTO system_activity (user_id, action, details) VALUES (?, ?, ?)').run(
      result.lastInsertRowid, 'User Registered', `New ${role} account created for ${name}`
    );

    res.status(201).json({ id: result.lastInsertRowid, name, email, role, xp: 0, level: 1 });
  } catch (err: any) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(400).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: 'Database error' });
    }
  }
});

router.get('/me', authenticateToken, (req: AuthRequest, res) => {
  const user = db.prepare('SELECT id, name, email, role, avatar, xp, level FROM users WHERE id = ?').get(req.user?.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

router.put('/me', authenticateToken, (req: AuthRequest, res) => {
  const { name, avatar } = req.body;
  try {
    db.prepare('UPDATE users SET name = ?, avatar = ? WHERE id = ?').run(name, avatar, req.user?.id);
    const user = db.prepare('SELECT id, name, email, role, avatar, xp, level FROM users WHERE id = ?').get(req.user?.id);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
