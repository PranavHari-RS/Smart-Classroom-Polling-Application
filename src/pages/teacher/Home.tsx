import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { BookOpen, Users, BarChart3, Plus, ArrowRight, Clock, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';

const TeacherHome = () => {
  const { user, token } = useAuth();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [recentAttempts, setRecentAttempts] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/quizzes', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setQuizzes(Array.isArray(data) ? data : []))
      .catch(() => {});

    fetch('/api/classrooms', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setClassrooms(Array.isArray(data) ? data : []))
      .catch(() => {});

    fetch('/api/attempts/all', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setRecentAttempts(Array.isArray(data) ? data.slice(0, 5) : []))
      .catch(() => {});
  }, [token]);

  const activeQuizzes = quizzes.filter(q => q.status === 'active').length;

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-8 text-white shadow-xl">
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Welcome back, {user?.name}! 👋</h1>
            <p className="text-indigo-100 text-lg max-w-2xl">
              Ready to inspire your students today? You have {activeQuizzes} active quizzes right now.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link 
                to="/teacher/create-quiz" 
                className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-colors flex items-center"
              >
                <Plus className="mr-2 w-5 h-5" /> Create New Quiz
              </Link>
              <Link 
                to="/teacher/dashboard"
                className="bg-indigo-500/30 backdrop-blur-md text-white border border-indigo-400/30 px-6 py-3 rounded-xl font-bold hover:bg-indigo-500/40 transition-colors flex items-center"
              >
                View All Quizzes <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl"></div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Stats */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl w-fit mb-4">
                <BookOpen className="w-6 h-6" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{quizzes.length}</p>
              <p className="text-sm text-gray-500">Total Quizzes</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="p-3 bg-green-50 text-green-600 rounded-xl w-fit mb-4">
                <Users className="w-6 h-6" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{classrooms.length}</p>
              <p className="text-sm text-gray-500">Classrooms</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl w-fit mb-4">
                <BarChart3 className="w-6 h-6" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{recentAttempts.length > 0 ? recentAttempts.length + '+' : '0'}</p>
              <p className="text-sm text-gray-500">Recent Submissions</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link to="/teacher/classrooms" className="flex items-center p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg mr-4">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Manage Classrooms</h3>
                  <p className="text-xs text-gray-500">Add or remove students</p>
                </div>
              </Link>
              <Link to="/teacher/question-bank" className="flex items-center p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-lg mr-4">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Question Bank</h3>
                  <p className="text-xs text-gray-500">Manage reusable questions</p>
                </div>
              </Link>
              <Link to="/teacher/analytics" className="flex items-center p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="p-3 bg-green-50 text-green-600 rounded-lg mr-4">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">View Analytics</h3>
                  <p className="text-xs text-gray-500">Check student performance</p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Sidebar: Recent Activity */}
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-indigo-600" />
              Recent Submissions
            </h3>
            <div className="space-y-4">
              {recentAttempts.map(attempt => (
                <div key={attempt.id} className="flex items-start space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                  <div className="mt-1 p-2 bg-green-50 text-green-600 rounded-lg">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900">{attempt.student_name}</p>
                    <p className="text-xs text-gray-500 line-clamp-1">Completed: {attempt.title}</p>
                    <p className="text-xs font-medium text-indigo-600 mt-1">Score: {attempt.score} pts</p>
                  </div>
                </div>
              ))}
              {recentAttempts.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No recent submissions.
                </div>
              )}
            </div>
            {recentAttempts.length > 0 && (
              <Link 
                to="/teacher/analytics" 
                className="block w-full mt-6 text-center text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                View All Results
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherHome;
