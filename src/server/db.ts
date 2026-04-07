import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../../database.sqlite');

const db = new Database(dbPath);

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('student', 'teacher', 'admin')),
    avatar TEXT,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS classrooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    teacher_id INTEGER NOT NULL,
    FOREIGN KEY(teacher_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS classroom_students (
    classroom_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    PRIMARY KEY(classroom_id, student_id),
    FOREIGN KEY(classroom_id) REFERENCES classrooms(id),
    FOREIGN KEY(student_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS quizzes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    teacher_id INTEGER NOT NULL,
    classroom_id INTEGER,
    status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'active', 'completed')),
    start_time TEXT,
    time_limit INTEGER, -- in minutes
    difficulty TEXT,
    FOREIGN KEY(teacher_id) REFERENCES users(id),
    FOREIGN KEY(classroom_id) REFERENCES classrooms(id)
  );

  CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quiz_id INTEGER NOT NULL,
    text TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('single', 'multiple', 'true_false')),
    options TEXT NOT NULL, -- JSON array
    correct_answers TEXT NOT NULL, -- JSON array
    time_limit INTEGER, -- in seconds, optional per question
    points INTEGER DEFAULT 1,
    FOREIGN KEY(quiz_id) REFERENCES quizzes(id)
  );

  CREATE TABLE IF NOT EXISTS question_bank (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teacher_id INTEGER NOT NULL,
    text TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('single', 'multiple', 'true_false')),
    options TEXT NOT NULL, -- JSON array
    correct_answers TEXT NOT NULL, -- JSON array
    points INTEGER DEFAULT 1,
    FOREIGN KEY(teacher_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS quiz_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quiz_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT,
    score INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK(status IN ('in_progress', 'submitted', 'missed')),
    FOREIGN KEY(quiz_id) REFERENCES quizzes(id),
    FOREIGN KEY(student_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS attempt_answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    attempt_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    selected_options TEXT NOT NULL, -- JSON array
    is_correct BOOLEAN NOT NULL,
    points_earned INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY(attempt_id) REFERENCES quiz_attempts(id),
    FOREIGN KEY(question_id) REFERENCES questions(id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS system_activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Seed initial admin user if not exists
const adminEmail = 'admin@example.com';
const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);

if (!adminExists) {
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(
    'System Admin', adminEmail, hashedPassword, 'admin'
  );
  
  // Seed a teacher and student for testing
  const teacherPassword = bcrypt.hashSync('teacher123', 10);
  const teacherResult = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(
    'Test Teacher', 'teacher@example.com', teacherPassword, 'teacher'
  );

  const studentPassword = bcrypt.hashSync('student123', 10);
  const studentResult = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(
    'Test Student', 'student@example.com', studentPassword, 'student'
  );

  const classroomResult = db.prepare('INSERT INTO classrooms (name, teacher_id) VALUES (?, ?)').run(
    'Math 101', teacherResult.lastInsertRowid
  );

  db.prepare('INSERT INTO classroom_students (classroom_id, student_id) VALUES (?, ?)').run(
    classroomResult.lastInsertRowid, studentResult.lastInsertRowid
  );
}

// Run migrations for existing databases
try {
  db.exec('ALTER TABLE users ADD COLUMN xp INTEGER DEFAULT 0');
} catch (e) {
  // Column might already exist
}

try {
  db.exec('ALTER TABLE users ADD COLUMN level INTEGER DEFAULT 1');
} catch (e) {
  // Column might already exist
}

export default db;
