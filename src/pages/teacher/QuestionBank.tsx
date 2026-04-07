import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Database, Plus, Trash2, Save } from 'lucide-react';

const QuestionBank = () => {
  const { token } = useAuth();
  const [questions, setQuestions] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [newQuestion, setNewQuestion] = useState({
    text: '',
    type: 'single',
    options: ['', '', '', ''],
    correct_answers: [] as string[],
    points: 1
  });

  useEffect(() => {
    fetchQuestions();
  }, [token]);

  const fetchQuestions = () => {
    fetch('/api/questions/bank', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setQuestions(Array.isArray(data) ? data : []))
      .catch(() => setQuestions([]));
  };

  const handleAddOption = () => {
    setNewQuestion({ ...newQuestion, options: [...newQuestion.options, ''] });
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...newQuestion.options];
    newOptions[index] = value;
    setNewQuestion({ ...newQuestion, options: newOptions });
  };

  const handleRemoveOption = (index: number) => {
    const newOptions = newQuestion.options.filter((_, i) => i !== index);
    setNewQuestion({ ...newQuestion, options: newOptions });
  };

  const toggleCorrectAnswer = (option: string) => {
    if (newQuestion.type === 'single' || newQuestion.type === 'true_false') {
      setNewQuestion({ ...newQuestion, correct_answers: [option] });
    } else {
      const current = newQuestion.correct_answers;
      if (current.includes(option)) {
        setNewQuestion({ ...newQuestion, correct_answers: current.filter(o => o !== option) });
      } else {
        setNewQuestion({ ...newQuestion, correct_answers: [...current, option] });
      }
    }
  };

  const handleSaveQuestion = async () => {
    if (!newQuestion.text || newQuestion.correct_answers.length === 0) {
      setMessage({ type: 'error', text: 'Please provide question text and at least one correct answer.' });
      return;
    }

    try {
      const res = await fetch('/api/questions/bank', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(newQuestion)
      });
      if (res.ok) {
        setIsAdding(false);
        setNewQuestion({
          text: '',
          type: 'single',
          options: ['', '', '', ''],
          correct_answers: [],
          points: 1
        });
        fetchQuestions();
        setMessage({ type: 'success', text: 'Question saved successfully' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save question' });
    }
  };

  const handleDeleteQuestion = async (id: number) => {
    try {
      const res = await fetch(`/api/questions/bank/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchQuestions();
        setMessage({ type: 'success', text: 'Question deleted successfully' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete question' });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {message.text && (
        <div className={`p-4 rounded-lg text-sm font-medium ${
          message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {message.text}
        </div>
      )}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <Database className="w-6 h-6 mr-2 text-indigo-600" /> Question Bank
        </h2>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          {isAdding ? 'Cancel' : <><Plus className="w-5 h-5 mr-2" /> Add Question</>}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Question</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
              <textarea
                value={newQuestion.text}
                onChange={e => setNewQuestion({ ...newQuestion, text: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question Type</label>
                <select
                  value={newQuestion.type}
                  onChange={e => {
                    const type = e.target.value;
                    setNewQuestion({ 
                      ...newQuestion, 
                      type,
                      options: type === 'true_false' ? ['True', 'False'] : ['', '', '', ''],
                      correct_answers: []
                    });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="single">Single Choice</option>
                  <option value="multiple">Multiple Choice</option>
                  <option value="true_false">True/False</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Points</label>
                <input
                  type="number"
                  min="1"
                  value={newQuestion.points}
                  onChange={e => setNewQuestion({ ...newQuestion, points: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Options & Correct Answer(s)</label>
              <div className="space-y-2">
                {newQuestion.options.map((opt, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type={newQuestion.type === 'multiple' ? 'checkbox' : 'radio'}
                      name="correct_answer"
                      checked={newQuestion.correct_answers.includes(opt) && opt !== ''}
                      onChange={() => toggleCorrectAnswer(opt)}
                      disabled={!opt}
                      className="w-5 h-5 text-indigo-600"
                    />
                    <input
                      type="text"
                      value={opt}
                      onChange={e => handleOptionChange(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      disabled={newQuestion.type === 'true_false'}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                    {newQuestion.type !== 'true_false' && (
                      <button onClick={() => handleRemoveOption(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {newQuestion.type !== 'true_false' && (
                <button onClick={handleAddOption} className="mt-2 text-sm text-indigo-600 font-medium hover:text-indigo-800">
                  + Add Option
                </button>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button 
                onClick={handleSaveQuestion}
                className="flex items-center px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <Save className="w-5 h-5 mr-2" /> Save to Bank
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {questions.map((q, index) => (
          <div key={q.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <div className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center font-bold mr-4">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{q.text}</h3>
                  <div className="mt-2 flex items-center space-x-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <span className="px-2 py-1 bg-gray-100 rounded">{q.type.replace('_', ' ')}</span>
                    <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded">{q.points} pts</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 ml-12 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {q.options.map((opt: string, i: number) => (
                  <div 
                    key={i} 
                    className={`px-4 py-2 rounded-lg text-sm border ${
                      q.correct_answers.includes(opt) 
                        ? 'bg-green-50 border-green-200 text-green-800 font-medium' 
                        : 'bg-gray-50 border-gray-200 text-gray-600'
                    }`}
                  >
                    {opt} {q.correct_answers.includes(opt) && '(Correct)'}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-start justify-end">
              <button 
                onClick={() => handleDeleteQuestion(q.id)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete Question"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
        {questions.length === 0 && !isAdding && (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
            <Database className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Your Question Bank is Empty</h3>
            <p className="text-gray-500 mt-2">Start adding questions to reuse them across multiple quizzes.</p>
            <button 
              onClick={() => setIsAdding(true)}
              className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Add First Question
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionBank;
