import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { BookOpen, Plus, Play, Pause, CheckCircle } from 'lucide-react';

const TeacherDashboard = () => {
  const { token } = useAuth();
  const [quizzes, setQuizzes] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/quizzes', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setQuizzes(Array.isArray(data) ? data : []))
      .catch(() => setQuizzes([]));
  }, [token]);

  const updateStatus = async (id: number, status: string) => {
    await fetch(`/api/quizzes/${id}/status`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ status })
    });
    setQuizzes(quizzes.map(q => q.id === id ? { ...q, status } : q));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">My Quizzes</h2>
        <Link 
          to="/teacher/create-quiz" 
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Quiz
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.map(quiz => (
          <div key={quiz.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            <div className="p-6 flex-1">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{quiz.title}</h3>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                  quiz.status === 'active' ? 'bg-green-100 text-green-700' :
                  quiz.status === 'published' ? 'bg-blue-100 text-blue-700' :
                  quiz.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {quiz.status}
                </span>
              </div>
              <p className="text-gray-500 text-sm mb-4 line-clamp-2">{quiz.description}</p>
              <div className="flex items-center text-sm text-gray-500 space-x-4">
                <span className="flex items-center"><BookOpen className="w-4 h-4 mr-1" /> {quiz.difficulty}</span>
                <span>{quiz.time_limit} mins</span>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end space-x-2">
              {quiz.status === 'draft' && (
                <button onClick={() => updateStatus(quiz.id, 'published')} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                  Publish
                </button>
              )}
              {quiz.status === 'published' && (
                <button onClick={() => updateStatus(quiz.id, 'active')} className="flex items-center text-sm font-medium text-green-600 hover:text-green-800">
                  <Play className="w-4 h-4 mr-1" /> Start Quiz
                </button>
              )}
              {quiz.status === 'active' && (
                <button onClick={() => updateStatus(quiz.id, 'completed')} className="flex items-center text-sm font-medium text-red-600 hover:text-red-800">
                  <Pause className="w-4 h-4 mr-1" /> End Quiz
                </button>
              )}
              {quiz.status === 'completed' && (
                <span className="flex items-center text-sm font-medium text-gray-500">
                  <CheckCircle className="w-4 h-4 mr-1" /> Finished
                </span>
              )}
            </div>
          </div>
        ))}
        {quizzes.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No quizzes</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new quiz.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
