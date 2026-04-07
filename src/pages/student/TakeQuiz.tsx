import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';

const TakeQuiz = () => {
  const { id } = useParams(); // attempt_id
  const { token } = useAuth();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<any>(null);
  const [attempt, setAttempt] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<number, string[]>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [score, setScore] = useState<{ score: number, total: number } | null>(null);

  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        const attemptRes = await fetch(`/api/attempts/my-attempts`, { headers: { Authorization: `Bearer ${token}` } });
        const attempts = await attemptRes.json();
        const currentAttempt = attempts.find((a: any) => a.id === Number(id));
        
        if (!currentAttempt) {
          navigate('/student');
          return;
        }
        setAttempt(currentAttempt);

        if (currentAttempt.status === 'submitted') {
          setSubmitted(true);
          setScore({ score: currentAttempt.score, total: 100 }); // Total is just a placeholder here
          return;
        }

        const quizRes = await fetch(`/api/quizzes/${currentAttempt.quiz_id}`, { headers: { Authorization: `Bearer ${token}` } });
        const quizData = await quizRes.json();
        setQuiz(quizData);

        // Calculate time left
        const startTime = new Date(currentAttempt.start_time).getTime();
        const timeLimitMs = quizData.time_limit * 60 * 1000;
        const endTime = startTime + timeLimitMs;
        const now = new Date().getTime();
        const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
        
        setTimeLeft(remaining);

        if (remaining === 0 && currentAttempt.status === 'in_progress') {
          handleSubmit();
        }
      } catch (err) {
        console.error('Error fetching quiz data:', err);
      }
    };

    fetchQuizData();
  }, [id, token, navigate]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || submitted) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev && prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev ? prev - 1 : 0;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, submitted]);

  const handleOptionChange = (questionId: number, option: string, type: string) => {
    setAnswers(prev => {
      if (type === 'single' || type === 'true_false') {
        return { ...prev, [questionId]: [option] };
      } else {
        const current = prev[questionId] || [];
        if (current.includes(option)) {
          return { ...prev, [questionId]: current.filter(o => o !== option) };
        } else {
          return { ...prev, [questionId]: [...current, option] };
        }
      }
    });
  };

  const handleSubmit = async () => {
    if (submitted) return;
    
    try {
      const res = await fetch(`/api/attempts/${id}/submit`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ answers })
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
        navigate(`/student/result/${id}`);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to submit quiz' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to submit quiz' });
    }
  };

  if (!quiz && !submitted) return <div className="flex justify-center items-center h-64">Loading...</div>;

  if (submitted) {
    return <div className="flex justify-center items-center h-64">Redirecting to results...</div>;
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {message.text && (
        <div className={`p-4 rounded-lg text-sm font-medium ${
          message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {message.text}
        </div>
      )}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-0 z-30 flex justify-between items-center mb-8">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{quiz.title}</h2>
          <p className="text-sm text-gray-500">{quiz.questions.length} questions</p>
        </div>
        <div className={`flex items-center px-4 py-2 rounded-lg font-bold text-lg ${
          timeLeft !== null && timeLeft < 60 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-indigo-50 text-indigo-700'
        }`}>
          <Clock className="w-5 h-5 mr-2" />
          {timeLeft !== null ? formatTime(timeLeft) : '--:--'}
        </div>
      </div>

      <div className="space-y-8">
        {quiz.questions.map((q: any, index: number) => (
          <div key={q.id} className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-start mb-6">
              <span className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold mr-4">
                {index + 1}
              </span>
              <h3 className="text-lg font-medium text-gray-900 mt-1">{q.text}</h3>
            </div>
            
            {q.type === 'multiple' && (
              <p className="text-sm text-gray-500 mb-4 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" /> Select all that apply
              </p>
            )}

            <div className="space-y-3 ml-12">
              {q.options.map((opt: string, oIndex: number) => {
                const isSelected = (answers[q.id] || []).includes(opt);
                return (
                  <label 
                    key={oIndex} 
                    className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                      isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type={q.type === 'single' || q.type === 'true_false' ? 'radio' : 'checkbox'}
                      name={`question-${q.id}`}
                      checked={isSelected}
                      onChange={() => handleOptionChange(q.id, opt, q.type)}
                      className={`w-5 h-5 text-indigo-600 focus:ring-indigo-500 ${
                        q.type === 'single' || q.type === 'true_false' ? 'border-gray-300' : 'rounded border-gray-300'
                      }`}
                    />
                    <span className={`ml-3 text-gray-700 ${isSelected ? 'font-medium' : ''}`}>{opt}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <p className="text-sm text-gray-500 font-medium">
            Answered: {Object.keys(answers).length} / {quiz.questions.length}
          </p>
          <button 
            onClick={() => {
              // Removed confirm for iframe compatibility
              handleSubmit();
            }}
            className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            Submit Quiz
          </button>
        </div>
      </div>
    </div>
  );
};

export default TakeQuiz;
