import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Icons } from '../components';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const API = `${BACKEND_URL}/api`;

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: '',
    discipline: '',
    hourly_rate: '',
    availability: 1.0
  });

  // EPC Role options
  const roleOptions = [
    { value: 'project_manager', label: 'Project Manager' },
    { value: 'engineering_manager', label: 'Engineering Manager' },
    { value: 'contractor', label: 'Contractor' },
    { value: 'senior_engineer_1', label: 'Senior Engineer Level 1' },
    { value: 'senior_engineer_2', label: 'Senior Engineer Level 2' },
    { value: 'intermediate_engineer', label: 'Intermediate Engineer' },
    { value: 'junior_engineer', label: 'Junior Engineer' }
  ];

  // Discipline options for EPC
  const disciplineOptions = [
    'Mechanical Engineering',
    'Electrical Engineering', 
    'Process Engineering',
    'Civil Engineering',
    'Instrumentation & Control',
    'Piping Engineering',
    'Safety Engineering',
    'Environmental Engineering',
    'Project Controls',
    'Quality Assurance',
    'Procurement',
    'Construction',
    'Commissioning',
    'Operations'
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/users`);
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const createUser = async (e) => {
    e.preventDefault();
    try {
      const userData = {
        ...newUser,
        hourly_rate: newUser.hourly_rate ? parseFloat(newUser.hourly_rate) : null,
        availability: parseFloat(newUser.availability)
      };
      
      await axios.post(`${API}/users`, userData);
      setNewUser({ name: '', email: '', role: '', discipline: '', hourly_rate: '', availability: 1.0 });
      setShowCreateUser(false);
      fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Failed to create user. Please check if email is already in use.');
    }
  };

  const updateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    
    try {
      const userData = {
        ...editingUser,
        hourly_rate: editingUser.hourly_rate ? parseFloat(editingUser.hourly_rate) : null,
        availability: parseFloat(editingUser.availability)
      };
      
      await axios.put(`${API}/users/${editingUser.id}`, userData);
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user. Please try again.');
    }
  };

  const deleteUser = async (userId) => {
    try {
      await axios.delete(`${API}/users/${userId}`);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      if (error.response && error.response.status === 400) {
        alert(error.response.data.detail);
      } else {
        alert('Failed to delete user. Please try again.');
      }
    }
  };

  const startEditUser = (user) => {
    setEditingUser({...user});
  };

  const getRoleLabel = (roleValue) => {
    const role = roleOptions.find(r => r.value === roleValue);
    return role ? role.label : roleValue.replace('_', ' ').toUpperCase();
  };

  const getUtilizationColor = (user) => {
    // Calculate utilization based on assigned tasks (simplified)
    const utilization = Math.random() * 120; // Mock data for now
    if (utilization > 100) return 'text-red-600 bg-red-100';
    if (utilization > 80) return 'text-orange-600 bg-orange-100';
    if (utilization > 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage EPC team members, roles, and assignments</p>
        </div>
        <button
          onClick={() => setShowCreateUser(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
        >
          <Icons.UserIcon className="h-5 w-5 inline mr-2" />
          Add Team Member
        </button>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map(user => (
          <div key={user.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                  <Icons.UserIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{user.name}</h3>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => startEditUser(user)}
                  className="text-gray-400 hover:text-blue-600 transition-colors"
                  title="Edit User"
                >
                  <Icons.EditIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deleteUser(user.id)}
                  className="text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete User"
                >
                  <Icons.DeleteIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Role</span>
                <span className="text-sm font-medium text-gray-900">{getRoleLabel(user.role)}</span>
              </div>
              
              {user.discipline && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Discipline</span>
                  <span className="text-sm font-medium text-gray-900">{user.discipline}</span>
                </div>
              )}
              
              {user.hourly_rate && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Hourly Rate</span>
                  <span className="text-sm font-medium text-gray-900">${user.hourly_rate}/hr</span>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Availability</span>
                <span className="text-sm font-medium text-gray-900">{(user.availability * 100)}%</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getUtilizationColor(user)}`}>
                {Math.round(Math.random() * 120)}% Utilized
              </span>
              <span className="text-xs text-gray-500">
                Active since {new Date(user.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {users.length === 0 && (
        <div className="text-center py-12">
          <Icons.UserIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Team Members Yet</h3>
          <p className="text-gray-600 mb-4">Add your first team member to get started</p>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md m-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Add New Team Member</h3>
            <form onSubmit={createUser} className="space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                value={newUser.name}
                onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
              
              <input
                type="email"
                placeholder="Email Address"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
              
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              >
                <option value="">Select Role</option>
                {roleOptions.map(role => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
              
              <select
                value={newUser.discipline}
                onChange={(e) => setNewUser({...newUser, discipline: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select Discipline (Optional)</option>
                {disciplineOptions.map(discipline => (
                  <option key={discipline} value={discipline}>{discipline}</option>
                ))}
              </select>
              
              <input
                type="number"
                placeholder="Hourly Rate (Optional)"
                value={newUser.hourly_rate}
                onChange={(e) => setNewUser({...newUser, hourly_rate: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                step="0.01"
                min="0"
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Availability ({(newUser.availability * 100)}%)
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  value={newUser.availability}
                  onChange={(e) => setNewUser({...newUser, availability: parseFloat(e.target.value)})}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>10%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-medium transition-colors"
                >
                  Add Team Member
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateUser(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md m-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Edit Team Member</h3>
            <form onSubmit={updateUser} className="space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                value={editingUser.name}
                onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
              
              <input
                type="email"
                placeholder="Email Address"
                value={editingUser.email}
                onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
              
              <select
                value={editingUser.role}
                onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              >
                <option value="">Select Role</option>
                {roleOptions.map(role => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
              
              <select
                value={editingUser.discipline || ''}
                onChange={(e) => setEditingUser({...editingUser, discipline: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select Discipline (Optional)</option>
                {disciplineOptions.map(discipline => (
                  <option key={discipline} value={discipline}>{discipline}</option>
                ))}
              </select>
              
              <input
                type="number"
                placeholder="Hourly Rate (Optional)"
                value={editingUser.hourly_rate || ''}
                onChange={(e) => setEditingUser({...editingUser, hourly_rate: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                step="0.01"
                min="0"
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Availability ({(editingUser.availability * 100)}%)
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  value={editingUser.availability}
                  onChange={(e) => setEditingUser({...editingUser, availability: parseFloat(e.target.value)})}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>10%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition-colors"
                >
                  Update Member
                </button>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
