import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, Clock, PlayCircle, CheckCircle, XCircle, Trophy, Star, Target } from 'lucide-react';

const StudentDashboard = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [stats, setStats] = useState({ completed: 0, average: 0, rank: 0 });
  const [message, setMessage] = useState({ type: '', text: '' });

  const isQuizzesView = location.pathname === '/student/quizzes';

  useEffect(() => {
    fetch('/api/quizzes', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setQuizzes(Array.isArray(data) ? data : []))
      .catch(() => setQuizzes([]));

    fetch('/api/attempts/my-attempts', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setAttempts(Array.isArray(data) ? data : []))
      .catch(() => setAttempts([]));

    fetch('/api/attempts/stats', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(() => {});
  }, [token]);

  const handleJoinQuiz = async (quizId: number) => {
    try {
      const res = await fetch('/api/attempts/start', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ quiz_id: quizId })
      });
      const data = await res.json();
      if (res.ok) {
        navigate(`/student/quiz/${data.attempt_id}`);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to join quiz' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to join quiz' });
    }
  };

  const getAttemptStatus = (quizId: number) => {
    return attempts.find(a => a.quiz_id === quizId);
  };

  const activeQuizzes = quizzes.filter(q => q.status === 'active' || q.status === 'published');
  const pastResults = attempts.filter(a => a.status === 'submitted' || a.status === 'missed');

  if (!isQuizzesView) {
    // Dashboard View (Summary)
    return (
      <div className="space-y-8">
        {message.text && (
          <div className={`p-4 rounded-lg text-sm font-medium ${
            message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              <p className="text-sm text-gray-500">Completed</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Star className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.average}%</p>
              <p className="text-sm text-gray-500">Avg Score</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">#{stats.rank || '0'}</p>
              <p className="text-sm text-gray-500">Classroom Rank</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Quizzes */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">Active Quizzes</h3>
              <Link to="/student/quizzes" className="text-sm text-indigo-600 font-bold hover:underline">View All</Link>
            </div>
            <div className="space-y-4">
              {activeQuizzes.slice(0, 3).map(quiz => (
                <div key={quiz.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-bold text-gray-900">{quiz.title}</p>
                    <p className="text-xs text-gray-500">{quiz.teacher_name} • {quiz.time_limit}m</p>
                  </div>
                  <button 
                    onClick={() => handleJoinQuiz(quiz.id)}
                    className="bg-white text-indigo-600 border border-indigo-100 px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-50 transition-colors"
                  >
                    Join
                  </button>
                </div>
              ))}
              {activeQuizzes.length === 0 && (
                <p className="text-center py-8 text-gray-500 text-sm">No active quizzes at the moment.</p>
              )}
            </div>
          </div>

          {/* Recent Results */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Recent Performance</h3>
            <div className="space-y-4">
              {pastResults.slice(0, 3).map(attempt => (
                <div key={attempt.id} className="flex items-center justify-between p-4 border border-gray-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${attempt.status === 'submitted' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      {attempt.status === 'submitted' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{attempt.title}</p>
                      <p className="text-xs text-gray-500">{new Date(attempt.start_time).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <p className="font-bold text-gray-900">{attempt.score} pts</p>
                </div>
              ))}
              {pastResults.length === 0 && (
                <p className="text-center py-8 text-gray-500 text-sm">No results yet. Take your first quiz!</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quizzes View (Full List)
  return (
    <div className="space-y-8">
      {message.text && (
        <div className={`p-4 rounded-lg text-sm font-medium ${
          message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {message.text}
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">All Available Quizzes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeQuizzes.map(quiz => {
            const attempt = getAttemptStatus(quiz.id);
            return (
              <div key={quiz.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{quiz.title}</h3>
                    {quiz.status === 'active' ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 flex items-center">
                        <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>
                        Live Now
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        Upcoming
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 text-sm mb-4 line-clamp-2">{quiz.description}</p>
                  <div className="flex items-center text-sm text-gray-500 space-x-4">
                    <span className="flex items-center"><BookOpen className="w-4 h-4 mr-1" /> {quiz.teacher_name}</span>
                    <span className="flex items-center"><Clock className="w-4 h-4 mr-1" /> {quiz.time_limit}m</span>
                  </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                  {attempt ? (
                    attempt.status === 'submitted' ? (
                      <div className="flex items-center justify-between text-sm font-medium text-gray-600">
                        <span className="flex items-center"><CheckCircle className="w-4 h-4 mr-1 text-green-500" /> Completed</span>
                        <button 
                          onClick={() => navigate(`/student/result/${attempt.id}`)}
                          className="text-indigo-600 hover:text-indigo-800 hover:underline"
                        >
                          View Results
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => navigate(`/student/quiz/${attempt.id}`)} className="w-full flex justify-center items-center px-4 py-2 bg-yellow-500 text-white font-medium rounded-lg hover:bg-yellow-600 transition-colors">
                        Resume Quiz
                      </button>
                    )
                  ) : quiz.status === 'active' ? (
                    <button onClick={() => handleJoinQuiz(quiz.id)} className="w-full flex justify-center items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                      <PlayCircle className="w-5 h-5 mr-2" /> Join Quiz
                    </button>
                  ) : (
                    <button disabled className="w-full flex justify-center items-center px-4 py-2 bg-gray-200 text-gray-500 font-medium rounded-lg cursor-not-allowed">
                      Waiting for teacher...
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {activeQuizzes.length === 0 && (
            <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No active quizzes</h3>
              <p className="mt-1 text-sm text-gray-500">Check back later for new assignments.</p>
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Past Results</h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-6 py-4 font-medium">Quiz Topic</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Score</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pastResults.map(attempt => (
                <tr key={attempt.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{attempt.title}</td>
                  <td className="px-6 py-4 text-gray-500">{new Date(attempt.start_time).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    {attempt.status === 'submitted' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Completed
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Missed
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-indigo-600">
                    {attempt.score} pts
                  </td>
                  <td className="px-6 py-4 text-right">
                    {attempt.status === 'submitted' && (
                      <button 
                        onClick={() => navigate(`/student/result/${attempt.id}`)}
                        className="text-indigo-600 hover:text-indigo-800 hover:underline font-medium"
                      >
                        Details
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {pastResults.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No past results found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
