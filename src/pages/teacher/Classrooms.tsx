import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Users, Plus, Trash2, UserPlus, X, Eye, EyeOff } from 'lucide-react';

const Classrooms = () => {
  const { token } = useAuth();
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [newClassroomName, setNewClassroomName] = useState('');
  const [selectedClassroom, setSelectedClassroom] = useState<number | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [newStudentId, setNewStudentId] = useState('');
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Create Student Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createStudentData, setCreateStudentData] = useState({ name: '', email: '', password: '' });
  const [isCreating, setIsCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const fetchAllStudents = () => {
    fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAllStudents(data.filter((u: any) => u.role === 'student'));
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchClassrooms();
    fetchAllStudents();
  }, [token]);

  useEffect(() => {
    if (selectedClassroom) {
      fetchStudents(selectedClassroom);
    }
  }, [selectedClassroom]);

  const fetchClassrooms = () => {
    fetch('/api/classrooms', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        const arr = Array.isArray(data) ? data : [];
        setClassrooms(arr);
        if (arr.length > 0 && !selectedClassroom) {
          setSelectedClassroom(arr[0].id);
        }
      })
      .catch(() => setClassrooms([]));
  };

  const fetchStudents = (classroomId: number) => {
    fetch(`/api/classrooms/${classroomId}/students`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setStudents(Array.isArray(data) ? data : []))
      .catch(() => setStudents([]));
  };

  const handleCreateClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassroomName.trim()) return;

    try {
      const res = await fetch('/api/classrooms', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ name: newClassroomName })
      });
      if (res.ok) {
        const newClassroom = await res.json();
        setNewClassroomName('');
        fetchClassrooms();
        setSelectedClassroom(newClassroom.id);
        setMessage({ type: 'success', text: 'Classroom created successfully' });
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Failed to create classroom' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to create classroom' });
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentId || !selectedClassroom) return;

    try {
      const res = await fetch(`/api/classrooms/${selectedClassroom}/students`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ student_id: Number(newStudentId) })
      });
      if (res.ok) {
        setNewStudentId('');
        fetchStudents(selectedClassroom);
        setMessage({ type: 'success', text: 'Student added successfully' });
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Failed to add student' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to add student' });
    }
  };

  const handleCreateAndAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassroom) return;
    setIsCreating(true);
    setMessage({ type: '', text: '' });

    try {
      // 1. Register the new student
      const regRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createStudentData.name,
          email: createStudentData.email,
          password: createStudentData.password,
          role: 'student'
        })
      });

      const regData = await regRes.json();

      if (!regRes.ok) {
        throw new Error(regData.error || 'Failed to create student account');
      }

      // 2. Add the new student to the classroom
      const addRes = await fetch(`/api/classrooms/${selectedClassroom}/students`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ student_id: regData.id })
      });

      if (!addRes.ok) {
        throw new Error('Student created, but failed to add to classroom');
      }

      // Success
      setMessage({ type: 'success', text: 'New student created and added to classroom!' });
      setShowCreateModal(false);
      setCreateStudentData({ name: '', email: '', password: '' });
      fetchAllStudents();
      fetchStudents(selectedClassroom);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'An error occurred' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleRemoveStudent = async (studentId: number) => {
    if (!selectedClassroom) return;

    try {
      const res = await fetch(`/api/classrooms/${selectedClassroom}/students/${studentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchStudents(selectedClassroom);
        setMessage({ type: 'success', text: 'Student removed successfully' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to remove student' });
    }
  };

  return (
    <div className="space-y-6 relative">
      {message.text && (
        <div className={`p-4 rounded-lg text-sm font-medium ${
          message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {message.text}
        </div>
      )}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Classrooms</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Classrooms List */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Classroom</h3>
            <form onSubmit={handleCreateClassroom} className="flex space-x-2">
              <input
                type="text"
                value={newClassroomName}
                onChange={e => setNewClassroomName(e.target.value)}
                placeholder="Classroom Name"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                <Plus className="w-5 h-5" />
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-100">
              <h3 className="font-semibold text-gray-700">My Classrooms</h3>
            </div>
            <ul className="divide-y divide-gray-100">
              {classrooms.map(c => (
                <li key={c.id}>
                  <button
                    onClick={() => setSelectedClassroom(c.id)}
                    className={`w-full text-left px-6 py-4 hover:bg-gray-50 transition-colors flex items-center justify-between ${
                      selectedClassroom === c.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''
                    }`}
                  >
                    <span className={`font-medium ${selectedClassroom === c.id ? 'text-indigo-700' : 'text-gray-900'}`}>
                      {c.name}
                    </span>
                    <Users className={`w-5 h-5 ${selectedClassroom === c.id ? 'text-indigo-500' : 'text-gray-400'}`} />
                  </button>
                </li>
              ))}
              {classrooms.length === 0 && (
                <li className="px-6 py-8 text-center text-gray-500">
                  No classrooms yet.
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Students List */}
        <div className="lg:col-span-2">
          {selectedClassroom ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Students in {classrooms.find(c => c.id === selectedClassroom)?.name}
                </h3>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <form onSubmit={handleAddStudent} className="flex space-x-2 flex-1 sm:flex-none">
                    <select
                      value={newStudentId}
                      onChange={e => setNewStudentId(e.target.value)}
                      className="flex-1 sm:w-48 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select Existing...</option>
                      {allStudents.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                      ))}
                    </select>
                    <button type="submit" className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 whitespace-nowrap">
                      <UserPlus className="w-4 h-4 mr-2" /> Add
                    </button>
                  </form>
                  <button 
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center justify-center px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4 mr-2" /> New Student
                  </button>
                </div>
              </div>
              
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-6 py-4 font-medium">Name</th>
                    <th className="px-6 py-4 font-medium">Email</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.map(student => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900 flex items-center">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold mr-3">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        {student.name}
                      </td>
                      <td className="px-6 py-4 text-gray-500">{student.email}</td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleRemoveStudent(student.id)}
                          className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                        No students in this classroom yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
              <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-lg">Select a classroom to view students.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Student Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">Create New Student</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreateAndAddStudent} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={createStudentData.name}
                  onChange={e => setCreateStudentData({...createStudentData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Jane Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={createStudentData.email}
                  onChange={e => setCreateStudentData({...createStudentData, email: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="jane@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={createStudentData.password}
                    onChange={e => setCreateStudentData({...createStudentData, password: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 pr-10"
                    placeholder="Minimum 6 characters"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create & Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Classrooms;
