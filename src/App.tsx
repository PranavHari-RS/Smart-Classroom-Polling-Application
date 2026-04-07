import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/Dashboard';
import TeacherDashboard from './pages/teacher/Dashboard';
import TeacherHome from './pages/teacher/Home';
import CreateQuiz from './pages/teacher/CreateQuiz';
import Classrooms from './pages/teacher/Classrooms';
import Analytics from './pages/teacher/Analytics';
import QuestionBank from './pages/teacher/QuestionBank';
import StudentDashboard from './pages/student/Dashboard';
import StudentHome from './pages/student/Home';
import Notifications from './pages/Notifications';
import TakeQuiz from './pages/student/TakeQuiz';
import Result from './pages/student/Result';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';

const ProtectedRoute = ({ children, roles }: { children: React.ReactNode, roles: string[] }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (!roles.includes(user.role)) return <Navigate to="/" />;
  
  return <>{children}</>;
};

const RoleRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return <Navigate to={`/${user.role}`} />;
};

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RoleRedirect />} />
          
          <Route element={<Layout />}>
            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>
            } />
            <Route path="/admin/quizzes" element={
              <ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>
            } />
            
            {/* Teacher Routes */}
            <Route path="/teacher" element={
              <ProtectedRoute roles={['teacher']}><TeacherHome /></ProtectedRoute>
            } />
            <Route path="/teacher/dashboard" element={
              <ProtectedRoute roles={['teacher']}><TeacherDashboard /></ProtectedRoute>
            } />
            <Route path="/teacher/create-quiz" element={
              <ProtectedRoute roles={['teacher']}><CreateQuiz /></ProtectedRoute>
            } />
            <Route path="/teacher/quizzes" element={
              <ProtectedRoute roles={['teacher']}><TeacherDashboard /></ProtectedRoute>
            } />
            <Route path="/teacher/classrooms" element={
              <ProtectedRoute roles={['teacher']}><Classrooms /></ProtectedRoute>
            } />
            <Route path="/teacher/analytics" element={
              <ProtectedRoute roles={['teacher']}><Analytics /></ProtectedRoute>
            } />
            <Route path="/teacher/question-bank" element={
              <ProtectedRoute roles={['teacher']}><QuestionBank /></ProtectedRoute>
            } />
            <Route path="/teacher/leaderboard" element={
              <ProtectedRoute roles={['teacher']}><Leaderboard /></ProtectedRoute>
            } />
            
            {/* Student Routes */}
            <Route path="/student" element={
              <ProtectedRoute roles={['student']}><StudentHome /></ProtectedRoute>
            } />
            <Route path="/student/dashboard" element={
              <ProtectedRoute roles={['student']}><StudentDashboard /></ProtectedRoute>
            } />
            <Route path="/student/quizzes" element={
              <ProtectedRoute roles={['student']}><StudentDashboard /></ProtectedRoute>
            } />
            <Route path="/student/notifications" element={
              <ProtectedRoute roles={['student']}><Notifications /></ProtectedRoute>
            } />
            <Route path="/student/quiz/:id" element={
              <ProtectedRoute roles={['student']}><TakeQuiz /></ProtectedRoute>
            } />
            <Route path="/student/result/:id" element={
              <ProtectedRoute roles={['student']}><Result /></ProtectedRoute>
            } />
            <Route path="/student/leaderboard" element={
              <ProtectedRoute roles={['student']}><Leaderboard /></ProtectedRoute>
            } />
            <Route path="/student/profile" element={
              <ProtectedRoute roles={['student']}><Profile /></ProtectedRoute>
            } />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

