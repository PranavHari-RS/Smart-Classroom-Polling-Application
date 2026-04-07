import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Trophy, Medal, Award } from 'lucide-react';

const Leaderboard = () => {
  const { token, user } = useAuth();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<number | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/quizzes', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        const completed = data.filter((q: any) => q.status === 'completed' || q.status === 'active');
        setQuizzes(completed);
        if (completed.length > 0) setSelectedQuiz(completed[0].id);
      });
  }, [token]);

  useEffect(() => {
    if (selectedQuiz) {
      fetch(`/api/attempts/quiz/${selectedQuiz}/leaderboard`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => setLeaderboard(data));
    }
  }, [selectedQuiz, token]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <Trophy className="w-6 h-6 mr-2 text-yellow-500" /> Leaderboard
          </h2>
          <select 
            value={selectedQuiz || ''} 
            onChange={e => setSelectedQuiz(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            {quizzes.map(q => (
              <option key={q.id} value={q.id}>{q.title}</option>
            ))}
          </select>
        </div>

        {leaderboard.length > 0 ? (
          <div className="space-y-4">
            {leaderboard.map((entry, index) => (
              <div 
                key={index} 
                className={`flex items-center justify-between p-4 rounded-xl border ${
                  index === 0 ? 'bg-yellow-50 border-yellow-200' :
                  index === 1 ? 'bg-gray-50 border-gray-200' :
                  index === 2 ? 'bg-orange-50 border-orange-200' :
                  'bg-white border-gray-100'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                    index === 0 ? 'bg-yellow-100 text-yellow-700' :
                    index === 1 ? 'bg-gray-200 text-gray-700' :
                    index === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {index === 0 ? <Trophy className="w-5 h-5" /> :
                     index === 1 ? <Medal className="w-5 h-5" /> :
                     index === 2 ? <Award className="w-5 h-5" /> :
                     index + 1}
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                      {entry.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{entry.name}</p>
                      <p className="text-xs text-gray-500">
                        {entry.end_time ? new Date(entry.end_time).toLocaleTimeString() : 'Not attempted'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-indigo-600">{entry.score}</p>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Points</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No results available for this quiz yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
