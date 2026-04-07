import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './src/server/db.js';
import authRoutes from './src/server/routes/auth.js';
import userRoutes from './src/server/routes/users.js';
import quizRoutes from './src/server/routes/quizzes.js';
import attemptRoutes from './src/server/routes/attempts.js';
import classroomRoutes from './src/server/routes/classrooms.js';
import questionRoutes from './src/server/routes/questions.js';
import notificationRoutes from './src/server/routes/notifications.js';
import adminRoutes from './src/server/routes/admin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // API routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/quizzes', quizRoutes);
  app.use('/api/attempts', attemptRoutes);
  app.use('/api/classrooms', classroomRoutes);
  app.use('/api/questions', questionRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/admin', adminRoutes);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n✅ Server running on http://localhost:${PORT}\n`);
  });

  // Handle port already in use gracefully
  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ Port ${PORT} is already in use.`);
      console.error(`   To fix: run this command, then try again:`);
      console.error(`   npx kill-port ${PORT}\n`);
      process.exit(1);
    } else {
      throw err;
    }
  });
}

startServer();
