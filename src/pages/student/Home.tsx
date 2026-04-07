import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Trophy, Star, BookOpen, Clock, ArrowRight, Bell, Zap, Target } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

const StudentHome = () => {
  const { user, token } = useAuth();
  const [stats, setStats] = useState({ completed: 0, average: 0, rank: 0 });
  const [announcements, setAnnouncements] = useState([
    { id: 1, title: 'New Math Quiz Available', date: '2 hours ago', type: 'new' },
    { id: 2, title: 'System Maintenance', date: 'Tomorrow, 2 PM', type: 'info' },
    { id: 3, title: 'Top Scorer of the Week', date: 'Yesterday', type: 'award' }
  ]);

  useEffect(() => {
    // Fetch some quick stats
    fetch('/api/attempts/stats', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(() => {});
  }, [token]);

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
              Ready to sharpen your skills today? You have 3 active quizzes waiting for you.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link 
                to="/student/dashboard" 
                className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-colors flex items-center"
              >
                Go to Dashboard <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <button className="bg-indigo-500/30 backdrop-blur-md text-white border border-indigo-400/30 px-6 py-3 rounded-xl font-bold hover:bg-indigo-500/40 transition-colors">
                View Schedule
              </button>
            </div>
          </motion.div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl"></div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Stats & Progress */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl w-fit mb-4">
                <Trophy className="w-6 h-6" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.completed}</p>
              <p className="text-sm text-gray-500">Quizzes Completed</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl w-fit mb-4">
                <Star className="w-6 h-6" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.average}%</p>
              <p className="text-sm text-gray-500">Average Score</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl w-fit mb-4">
                <Target className="w-6 h-6" />
              </div>
              <p className="text-3xl font-bold text-gray-900">#{stats.rank || '0'}</p>
              <p className="text-sm text-gray-500">Classroom Rank</p>
            </div>
          </div>

          {/* Daily Challenge / Recommended */}
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Zap className="w-6 h-6 text-amber-500 mr-2" />
                Daily Challenge
              </h2>
              <span className="text-sm text-gray-500 font-medium">Ends in 4h 20m</span>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Logical Reasoning Master</h3>
                <p className="text-gray-600 mb-6">
                  Test your logic with 10 quick questions. Earn double XP and a special badge!
                </p>
                <button className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors">
                  Start Challenge
                </button>
              </div>
              <div className="w-full md:w-48 h-48 bg-indigo-50 rounded-2xl flex items-center justify-center relative">
                <div className="absolute inset-0 bg-indigo-500/5 rounded-2xl animate-pulse"></div>
                <Trophy className="w-24 h-24 text-indigo-200" />
                <div className="absolute -top-2 -right-2 bg-amber-400 text-white text-xs font-bold px-2 py-1 rounded-lg">
                  +500 XP
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar: Announcements & Activity */}
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
              <Bell className="w-5 h-5 mr-2 text-indigo-600" />
              Announcements
            </h3>
            <div className="space-y-6">
              {announcements.map(ann => (
                <div key={ann.id} className="flex space-x-4">
                  <div className={`w-2 h-2 mt-2 rounded-full shrink-0 ${
                    ann.type === 'new' ? 'bg-green-500' :
                    ann.type === 'info' ? 'bg-blue-500' : 'bg-amber-500'
                  }`} />
                  <div>
                    <p className="text-sm font-bold text-gray-800 leading-tight">{ann.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{ann.date}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link 
              to="/student/notifications" 
              className="block w-full mt-8 text-center text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              View All Notifications
            </Link>
          </div>

          <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200">
            <h3 className="font-bold mb-4">Pro Tip 💡</h3>
            <p className="text-indigo-100 text-sm leading-relaxed">
              Reviewing your past mistakes is the fastest way to improve. Check the "Past Results" section in your dashboard to see detailed explanations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentHome;
