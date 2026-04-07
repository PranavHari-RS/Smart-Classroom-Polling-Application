import express from 'express';
import db from '../db.js';
import { authenticateToken, requireRole, AuthRequest } from '../auth.js';

const router = express.Router();

// Get classrooms for the current user
router.get('/', authenticateToken, (req: AuthRequest, res) => {
  const { id, role } = req.user!;
  
  try {
    if (role === 'teacher') {
      const classrooms = db.prepare('SELECT * FROM classrooms WHERE teacher_id = ?').all(id);
      res.json(classrooms);
    } else if (role === 'student') {
      const classrooms = db.prepare(`
        SELECT c.*, u.name as teacher_name 
        FROM classrooms c
        JOIN classroom_students cs ON c.id = cs.classroom_id
        JOIN users u ON c.teacher_id = u.id
        WHERE cs.student_id = ?
      `).all(id);
      res.json(classrooms);
    } else if (role === 'admin') {
      const classrooms = db.prepare(`
        SELECT c.*, u.name as teacher_name 
        FROM classrooms c
        JOIN users u ON c.teacher_id = u.id
      `).all();
      res.json(classrooms);
    } else {
      res.status(403).json({ error: 'Unauthorized' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch classrooms' });
  }
});

// Create a classroom (Teacher/Admin)
router.post('/', authenticateToken, requireRole(['teacher', 'admin']), (req: AuthRequest, res) => {
  const { name, teacher_id } = req.body;
  const { id, role } = req.user!;
  
  const targetTeacherId = role === 'admin' ? teacher_id : id;
  
  if (!name || !targetTeacherId) {
    return res.status(400).json({ error: 'Name and teacher ID are required' });
  }

  try {
    const result = db.prepare('INSERT INTO classrooms (name, teacher_id) VALUES (?, ?)').run(name, targetTeacherId);
    res.status(201).json({ id: result.lastInsertRowid, name, teacher_id: targetTeacherId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create classroom' });
  }
});

// Get students in a classroom
router.get('/:id/students', authenticateToken, (req: AuthRequest, res) => {
  const classroomId = req.params.id;
  
  try {
    const students = db.prepare(`
      SELECT u.id, u.name, u.email, u.avatar 
      FROM users u
      JOIN classroom_students cs ON u.id = cs.student_id
      WHERE cs.classroom_id = ?
    `).all(classroomId);
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Add student to classroom (Teacher/Admin)
router.post('/:id/students', authenticateToken, requireRole(['teacher', 'admin']), (req: AuthRequest, res) => {
  const classroomId = req.params.id;
  const { student_id } = req.body;
  
  if (!student_id) return res.status(400).json({ error: 'Student ID is required' });

  try {
    // Verify teacher owns this classroom if not admin
    if (req.user!.role === 'teacher') {
      const classroom = db.prepare('SELECT teacher_id FROM classrooms WHERE id = ?').get(classroomId) as any;
      if (!classroom || classroom.teacher_id !== req.user!.id) {
        return res.status(403).json({ error: 'Not authorized to modify this classroom' });
      }
    }

    db.prepare('INSERT INTO classroom_students (classroom_id, student_id) VALUES (?, ?)').run(classroomId, student_id);
    res.status(201).json({ success: true });
  } catch (err: any) {
    if (err.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
      res.status(400).json({ error: 'Student already in classroom' });
    } else {
      res.status(500).json({ error: 'Failed to add student' });
    }
  }
});

// Remove student from classroom (Teacher/Admin)
router.delete('/:id/students/:studentId', authenticateToken, requireRole(['teacher', 'admin']), (req: AuthRequest, res) => {
  const { id: classroomId, studentId } = req.params;

  try {
    if (req.user!.role === 'teacher') {
      const classroom = db.prepare('SELECT teacher_id FROM classrooms WHERE id = ?').get(classroomId) as any;
      if (!classroom || classroom.teacher_id !== req.user!.id) {
        return res.status(403).json({ error: 'Not authorized to modify this classroom' });
      }
    }

    db.prepare('DELETE FROM classroom_students WHERE classroom_id = ? AND student_id = ?').run(classroomId, studentId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove student' });
  }
});

export default router;
