import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle, XCircle, Clock, Award, ArrowLeft } from 'lucide-react';

const Result = () => {
  const { id } = useParams(); // attempt_id
  const { token } = useAuth();
  const navigate = useNavigate();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const res = await fetch(`/api/attempts/${id}/result`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setResult(data);
        } else {
          navigate('/student/dashboard');
        }
      } catch (err) {
        console.error('Failed to fetch result');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [id, token, navigate]);

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;
  if (!result) return <div className="text-center text-gray-500">Result not found</div>;

  const totalPoints = result.questions.reduce((acc: number, q: any) => acc + q.points, 0);
  const percentage = Math.round((result.score / totalPoints) * 100);
  
  const startTime = new Date(result.start_time).getTime();
  const endTime = new Date(result.end_time).getTime();
  const timeTakenSeconds = Math.floor((endTime - startTime) / 1000);
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <button 
        onClick={() => navigate('/student/dashboard')}
        className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-indigo-600 p-8 text-white text-center">
          <h2 className="text-3xl font-bold mb-2">{result.title}</h2>
          <p className="text-indigo-200">{result.description}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
          <div className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full mb-3">
              <Award className="w-6 h-6" />
            </div>
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Score</p>
            <p className="text-3xl font-bold text-gray-900">{result.score} <span className="text-lg text-gray-400 font-normal">/ {totalPoints}</span></p>
            <p className={`text-sm font-medium mt-1 ${percentage >= 70 ? 'text-green-600' : percentage >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
              {percentage}%
            </p>
          </div>
          
          <div className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 text-blue-600 rounded-full mb-3">
              <Clock className="w-6 h-6" />
            </div>
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Time Taken</p>
            <p className="text-3xl font-bold text-gray-900">{formatTime(timeTakenSeconds)}</p>
          </div>
          
          <div className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-50 text-green-600 rounded-full mb-3">
              <CheckCircle className="w-6 h-6" />
            </div>
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Accuracy</p>
            <p className="text-3xl font-bold text-gray-900">
              {result.questions.filter((q: any) => q.is_correct).length} <span className="text-lg text-gray-400 font-normal">/ {result.questions.length}</span>
            </p>
            <p className="text-sm text-gray-500 mt-1">Correct Answers</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-bold text-gray-900">Detailed Review</h3>
        
        {result.questions.map((q: any, index: number) => (
          <div key={q.id} className={`bg-white p-6 rounded-xl shadow-sm border-l-4 ${q.is_correct ? 'border-l-green-500 border-y-gray-100 border-r-gray-100' : 'border-l-red-500 border-y-gray-100 border-r-gray-100'}`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start">
                <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold mr-4 ${q.is_correct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {index + 1}
                </span>
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mt-1">{q.text}</h4>
                  <p className="text-sm text-gray-500 mt-1">Points: {q.points_earned} / {q.points}</p>
                </div>
              </div>
              {q.is_correct ? (
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
              ) : (
                <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
              )}
            </div>

            <div className="ml-12 space-y-2">
              {q.options.map((opt: string, oIndex: number) => {
                const isSelected = q.user_answer.includes(opt);
                const isCorrect = q.correct_answers.includes(opt);
                
                let optionClass = "border-gray-200 bg-gray-50 text-gray-700";
                if (isSelected && isCorrect) optionClass = "border-green-500 bg-green-50 text-green-800 font-medium";
                else if (isSelected && !isCorrect) optionClass = "border-red-500 bg-red-50 text-red-800 font-medium";
                else if (!isSelected && isCorrect) optionClass = "border-green-500 bg-white text-green-800 border-dashed";

                return (
                  <div key={oIndex} className={`p-3 border rounded-lg flex items-center justify-between ${optionClass}`}>
                    <div className="flex items-center">
                      <div className={`w-4 h-4 rounded-full border mr-3 flex items-center justify-center ${
                        isSelected ? (isCorrect ? 'border-green-500 bg-green-500' : 'border-red-500 bg-red-500') : 'border-gray-300'
                      }`}>
                        {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                      </div>
                      <span>{opt}</span>
                    </div>
                    {isCorrect && !isSelected && <span className="text-xs font-medium text-green-600 uppercase tracking-wider">Correct Answer</span>}
                    {isSelected && isCorrect && <span className="text-xs font-medium text-green-600 uppercase tracking-wider">Your Answer</span>}
                    {isSelected && !isCorrect && <span className="text-xs font-medium text-red-600 uppercase tracking-wider">Your Answer</span>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Result;
