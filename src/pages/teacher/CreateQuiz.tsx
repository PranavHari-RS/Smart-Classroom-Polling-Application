import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, Plus, Trash2, Save, Database, X, ArrowRight, ArrowLeft } from 'lucide-react';

const CreateQuiz = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeLimit, setTimeLimit] = useState(30);
  const [difficulty, setDifficulty] = useState('medium');
  const [selectedClassroom, setSelectedClassroom] = useState<number | ''>('');
  const [classrooms, setClassrooms] = useState<any[]>([]);
  
  const [questions, setQuestions] = useState<any[]>([]);
  
  // AI Generation State
  const [aiTopic, setAiTopic] = useState('');
  const [aiCount, setAiCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);

  // Question Bank State
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankQuestions, setBankQuestions] = useState<any[]>([]);
  const [selectedBankQuestions, setSelectedBankQuestions] = useState<number[]>([]);

  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetch('/api/classrooms', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setClassrooms(Array.isArray(data) ? data : []));
  }, [token]);

  useEffect(() => {
    if (showBankModal && bankQuestions.length === 0) {
      fetch('/api/questions/bank', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => setBankQuestions(data));
    }
  }, [showBankModal, token]);

  const handleNextStep = () => {
    if (!title || !selectedClassroom) {
      setMessage({ type: 'error', text: 'Title and Classroom are required' });
      return;
    }
    setMessage({ type: '', text: '' });
    setStep(2);
  };

  const handleAddFromBank = () => {
    const selected = bankQuestions.filter(q => selectedBankQuestions.includes(q.id));
    // Remove id before adding to quiz
    const newQs = selected.map(({ id, teacher_id, ...rest }) => rest);
    setQuestions([...questions, ...newQs]);
    setShowBankModal(false);
    setSelectedBankQuestions([]);
  };

  const toggleBankQuestion = (id: number) => {
    if (selectedBankQuestions.includes(id)) {
      setSelectedBankQuestions(selectedBankQuestions.filter(qId => qId !== id));
    } else {
      setSelectedBankQuestions([...selectedBankQuestions, id]);
    }
  };

  const handleGenerateAI = async () => {
    if (!aiTopic) {
      setMessage({ type: 'error', text: 'Please enter a topic' });
      return;
    }
    setIsGenerating(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch('/api/quizzes/generate-ai', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ topic: aiTopic, count: aiCount, difficulty })
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to generate quiz');
      }

      const data = await res.json();
      
      if (data.title && !title) setTitle(data.title);
      if (data.description && !description) setDescription(data.description);
      if (data.questions) {
        setQuestions([...questions, ...data.questions]);
      } else if (Array.isArray(data)) {
        setQuestions([...questions, ...data]);
      }
      setMessage({ type: 'success', text: 'Quiz generated successfully!' });
    } catch (err: any) {
      console.error('AI Generation Error:', err);
      setMessage({ type: 'error', text: err.message || 'Error generating quiz' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveQuiz = async () => {
    if (!title || questions.length === 0 || !selectedClassroom) {
      setMessage({ type: 'error', text: 'Title, Classroom, and at least 1 question required' });
      return;
    }

    try {
      const res = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ title, description, time_limit: timeLimit, difficulty, classroom_id: selectedClassroom, questions })
      });
      if (res.ok) {
        navigate('/teacher/dashboard');
      } else {
        setMessage({ type: 'error', text: 'Failed to save quiz' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error saving quiz' });
    }
  };

  const addManualQuestion = () => {
    setQuestions([...questions, { text: '', type: 'single', options: ['', '', '', ''], correct_answers: [] }]);
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const newQs = [...questions];
    newQs[index][field] = value;
    setQuestions(newQs);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {message.text && (
        <div className={`p-4 rounded-lg text-sm font-medium ${
          message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Step Indicator */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        <div className={`flex items-center ${step >= 1 ? 'text-indigo-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 ${step >= 1 ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300'}`}>1</div>
          <span className="ml-2 font-medium">Quiz Details</span>
        </div>
        <div className={`w-16 h-1 rounded ${step >= 2 ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>
        <div className={`flex items-center ${step >= 2 ? 'text-indigo-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 ${step >= 2 ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300'}`}>2</div>
          <span className="ml-2 font-medium">Questions</span>
        </div>
      </div>

      {step === 1 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Quiz Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g. Advanced Mathematics" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" rows={3} />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Classroom *</label>
              <select value={selectedClassroom} onChange={e => setSelectedClassroom(Number(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                <option value="">Select a classroom...</option>
                {classrooms.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time Limit (minutes)</label>
              <input type="number" value={timeLimit} onChange={e => setTimeLimit(Number(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
              <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
          <div className="mt-8 flex justify-end">
            <button 
              onClick={handleNextStep}
              className="flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Next Step <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
            <h3 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center">
              <Sparkles className="w-5 h-5 mr-2" /> AI Quiz & Question Generator
            </h3>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-indigo-800 mb-1">Topic</label>
                <input type="text" value={aiTopic} onChange={e => setAiTopic(e.target.value)} className="w-full px-4 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Photosynthesis" />
              </div>
              <div className="w-32">
                <label className="block text-sm font-medium text-indigo-800 mb-1">Count</label>
                <input type="number" min="1" max="20" value={aiCount} onChange={e => setAiCount(Number(e.target.value))} className="w-full px-4 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500" />
              </div>
              <button 
                onClick={handleGenerateAI} 
                disabled={isGenerating}
                className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {isGenerating ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">Questions ({questions.length})</h3>
              <div className="flex space-x-3">
                <button onClick={() => setShowBankModal(true)} className="flex items-center px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors">
                  <Database className="w-4 h-4 mr-2" /> Add from Bank
                </button>
                <button onClick={addManualQuestion} className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <Plus className="w-4 h-4 mr-2" /> Add Manual
                </button>
              </div>
            </div>

            {questions.map((q, qIndex) => (
              <div key={qIndex} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 relative">
                <button onClick={() => setQuestions(questions.filter((_, i) => i !== qIndex))} className="absolute top-4 right-4 text-gray-400 hover:text-red-500">
                  <Trash2 className="w-5 h-5" />
                </button>
                <div className="mb-4 pr-8 flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Question {qIndex + 1}</label>
                    <input type="text" value={q.text} onChange={e => updateQuestion(qIndex, 'text', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="w-48">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select 
                      value={q.type} 
                      onChange={e => {
                        const newType = e.target.value;
                        updateQuestion(qIndex, 'type', newType);
                        if (newType === 'true_false') {
                          updateQuestion(qIndex, 'options', ['True', 'False']);
                          updateQuestion(qIndex, 'correct_answers', []);
                        } else if (q.type === 'true_false') {
                          updateQuestion(qIndex, 'options', ['', '', '', '']);
                          updateQuestion(qIndex, 'correct_answers', []);
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="single">Single Choice</option>
                      <option value="multiple">Multiple Choice</option>
                      <option value="true_false">True / False</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {q.options.map((opt: string, oIndex: number) => (
                    <div key={oIndex} className="flex items-center space-x-3">
                      <input 
                        type={q.type === 'single' || q.type === 'true_false' ? 'radio' : 'checkbox'} 
                        name={`q-${qIndex}`}
                        checked={q.correct_answers.includes(opt)}
                        onChange={(e) => {
                          if (q.type === 'single' || q.type === 'true_false') {
                            updateQuestion(qIndex, 'correct_answers', [opt]);
                          } else {
                            const newAnswers = e.target.checked 
                              ? [...q.correct_answers, opt] 
                              : q.correct_answers.filter((a: string) => a !== opt);
                            updateQuestion(qIndex, 'correct_answers', newAnswers);
                          }
                        }}
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                      />
                      <input 
                        type="text" 
                        value={opt} 
                        onChange={e => {
                          const newOptions = [...q.options];
                          newOptions[oIndex] = e.target.value;
                          updateQuestion(qIndex, 'options', newOptions);
                        }} 
                        disabled={q.type === 'true_false'}
                        className={`flex-1 px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 text-sm ${q.type === 'true_false' ? 'bg-gray-100 text-gray-600' : ''}`} 
                        placeholder={`Option ${oIndex + 1}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-6 border-t border-gray-200">
            <button 
              onClick={() => setStep(1)}
              className="flex items-center px-6 py-3 bg-white text-gray-700 border border-gray-300 font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
              <ArrowLeft className="w-5 h-5 mr-2" /> Back
            </button>
            <button 
              onClick={handleSaveQuiz}
              className="flex items-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm"
            >
              <Save className="w-5 h-5 mr-2" /> Save & Publish Later
            </button>
          </div>
        </div>
      )}

      {showBankModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800 flex items-center">
                <Database className="w-6 h-6 mr-2 text-indigo-600" /> Select from Question Bank
              </h3>
              <button onClick={() => setShowBankModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {bankQuestions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Your question bank is empty. Add questions from the Question Bank page.
                </div>
              ) : (
                bankQuestions.map((q, index) => (
                  <div 
                    key={q.id} 
                    onClick={() => toggleBankQuestion(q.id)}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedBankQuestions.includes(q.id) 
                        ? 'border-indigo-500 bg-indigo-50' 
                        : 'border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-start">
                      <div className="mt-1 mr-3">
                        <input 
                          type="checkbox" 
                          checked={selectedBankQuestions.includes(q.id)}
                          readOnly
                          className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{q.text}</h4>
                        <div className="mt-2 text-sm text-gray-500 flex items-center space-x-2">
                          <span className="px-2 py-0.5 bg-gray-100 rounded text-xs uppercase">{q.type.replace('_', ' ')}</span>
                          <span>{q.points} pts</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-6 border-t border-gray-100 flex justify-end space-x-3 bg-gray-50 rounded-b-xl">
              <button 
                onClick={() => setShowBankModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddFromBank}
                disabled={selectedBankQuestions.length === 0}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                Add Selected ({selectedBankQuestions.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateQuiz;
