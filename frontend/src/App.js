import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Components from "./Components";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Home Page Component
const HomePage = () => {
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      const [statsRes, tasksRes, projectsRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`),
        axios.get(`${API}/tasks`),
        axios.get(`${API}/projects`)
      ]);
      
      setStats(statsRes.data);
      
      // Combine recent activity from tasks and projects
      const activity = [
        ...tasksRes.data.slice(0, 3).map(task => ({
          type: 'task',
          title: task.title,
          status: task.status,
          created_at: task.created_at
        })),
        ...projectsRes.data.slice(0, 3).map(project => ({
          type: 'project', 
          title: project.name,
          status: project.status,
          created_at: project.created_at
        }))
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
      
      setRecentActivity(activity);
    } catch (error) {
      console.error('Error fetching home data:', error);
    }
  };

  if (!stats) return <div className="flex justify-center items-center h-64">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-6">
              PMFusion
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              The ultimate project management platform that fuses the power of Primavera P6 scheduling 
              with Jira's agile workflows, designed specifically for EPC teams in oil & gas engineering.
            </p>
            <div className="flex justify-center gap-4">
              <Link 
                to="/dashboard" 
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-xl font-semibold transition-colors text-lg"
              >
                Open Dashboard
              </Link>
              <Link 
                to="/projects" 
                className="bg-white hover:bg-gray-50 text-purple-600 border-2 border-purple-600 px-8 py-4 rounded-xl font-semibold transition-colors text-lg"
              >
                Manage Projects
              </Link>
              <Link 
                to="/users" 
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-semibold transition-colors text-lg"
              >
                Manage Team
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Platform Overview</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="stats-card stats-card-total">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">Total Projects</p>
                  <p className="text-3xl font-bold text-white">{stats.total_projects}</p>
                </div>
                <Components.ProjectIcon className="h-8 w-8 text-white/60" />
              </div>
            </div>
          </div>

          <div className="stats-card stats-card-active">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">Active Projects</p>
                  <p className="text-3xl font-bold text-white">{stats.active_projects}</p>
                </div>
                <Components.ActiveIcon className="h-8 w-8 text-white/60" />
              </div>
            </div>
          </div>

          <div className="stats-card stats-card-tasks">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">Total Tasks</p>
                  <p className="text-3xl font-bold text-white">{stats.total_tasks}</p>
                </div>
                <Components.TaskIcon className="h-8 w-8 text-white/60" />
              </div>
            </div>
          </div>

          <div className="stats-card stats-card-completed">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">Completed Tasks</p>
                  <p className="text-3xl font-bold text-white">{stats.completed_tasks}</p>
                </div>
                <Components.CompleteIcon className="h-8 w-8 text-white/60" />
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h3>
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No recent activity</p>
              ) : (
                recentActivity.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center">
                      {item.type === 'project' ? (
                        <Components.ProjectIcon className="h-5 w-5 text-purple-600 mr-3" />
                      ) : (
                        <Components.TaskIcon className="h-5 w-5 text-blue-600 mr-3" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{item.title}</p>
                        <p className="text-sm text-gray-600 capitalize">
                          {item.type} • {item.status.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Key Features */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Key Features</h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <Components.ChartIcon className="h-6 w-6 text-purple-600 mr-3 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">Gantt Chart Scheduling</h4>
                  <p className="text-sm text-gray-600">Visual project timelines with critical path analysis</p>
                </div>
              </div>
              <div className="flex items-start">
                <Components.TaskIcon className="h-6 w-6 text-blue-600 mr-3 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">Agile Kanban Boards</h4>
                  <p className="text-sm text-gray-600">Flexible task management with drag-and-drop workflow</p>
                </div>
              </div>
              <div className="flex items-start">
                <Components.ResourceIcon className="h-6 w-6 text-green-600 mr-3 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">Resource Management</h4>
                  <p className="text-sm text-gray-600">Track engineer allocation and utilization across projects</p>
                </div>
              </div>
              <div className="flex items-start">
                <Components.UserIcon className="h-6 w-6 text-orange-600 mr-3 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">EPC Team Structure</h4>
                  <p className="text-sm text-gray-600">Built for engineering hierarchies and disciplines</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Project-Specific Dashboard Component
const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchDashboardData(selectedProject.id);
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API}/projects`);
      setProjects(response.data);
      if (response.data.length > 0 && !selectedProject) {
        setSelectedProject(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchDashboardData = async (projectId) => {
    try {
      const [statsRes, tasksRes] = await Promise.all([
        axios.get(`${API}/projects/${projectId}/dashboard`),
        axios.get(`${API}/tasks?project_id=${projectId}`)
      ]);
      
      setStats(statsRes.data);
      setRecentTasks(tasksRes.data.slice(0, 5)); // Show 5 recent tasks
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  if (projects.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Components.ProjectIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Projects Found</h3>
          <p className="text-gray-600 mb-4">Create your first project to view the dashboard</p>
          <Link 
            to="/projects" 
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            Create Project
          </Link>
        </div>
      </div>
    );
  }

  if (!stats) return <div className="flex justify-center items-center h-64">Loading...</div>;

  return (
    <div className="p-6">
      {/* Project Selector */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Project Dashboard</h1>
          <Link 
            to="/projects" 
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Manage Projects
          </Link>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {projects.map(project => (
            <button
              key={project.id}
              onClick={() => setSelectedProject(project)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedProject?.id === project.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {project.name}
            </button>
          ))}
        </div>
        
        {selectedProject && (
          <div className="mt-4 p-4 bg-purple-50 rounded-xl">
            <h2 className="font-semibold text-purple-900">{selectedProject.name}</h2>
            <p className="text-sm text-purple-700">{selectedProject.description}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-purple-600">
              <span>Status: {selectedProject.status.replace('_', ' ').toUpperCase()}</span>
              <span>Start: {new Date(selectedProject.start_date).toLocaleDateString()}</span>
              {selectedProject.end_date && (
                <span>End: {new Date(selectedProject.end_date).toLocaleDateString()}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="stats-card stats-card-tasks">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium">Total Tasks</p>
                <p className="text-3xl font-bold text-white">{stats.total_tasks}</p>
              </div>
              <Components.TaskIcon className="h-8 w-8 text-white/60" />
            </div>
          </div>
        </div>

        <div className="stats-card stats-card-completed">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium">Completed</p>
                <p className="text-3xl font-bold text-white">{stats.completed_tasks}</p>
              </div>
              <Components.CompleteIcon className="h-8 w-8 text-white/60" />
            </div>
          </div>
        </div>

        <div className="stats-card stats-card-active">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium">In Progress</p>
                <p className="text-3xl font-bold text-white">{stats.in_progress_tasks}</p>
              </div>
              <Components.ActiveIcon className="h-8 w-8 text-white/60" />
            </div>
          </div>
        </div>

        <div className="stats-card stats-card-total">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium">Milestones</p>
                <p className="text-3xl font-bold text-white">{stats.my_tasks}</p>
              </div>
              <Components.MilestoneIcon className="h-8 w-8 text-white/60" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Tasks */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Tasks</h3>
            <Link 
              to="/projects" 
              className="text-purple-600 hover:text-purple-700 text-sm font-medium"
            >
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {recentTasks.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No tasks in this project yet</p>
            ) : (
              recentTasks.map(task => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center">
                    {task.is_milestone ? (
                      <Components.MilestoneIcon className="h-4 w-4 text-yellow-600 mr-3" />
                    ) : (
                      <Components.TaskIcon className="h-4 w-4 text-gray-600 mr-3" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{task.title}</p>
                      <p className="text-sm text-gray-600">{task.status.replace('_', ' ').toUpperCase()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Components.PriorityBadge priority={task.priority} />
                    {task.progress_percent !== undefined && (
                      <div className="mt-1 text-xs text-gray-600">{task.progress_percent}% complete</div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Project Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <Link 
              to="/projects" 
              className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-center"
            >
              <Components.TaskIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="font-medium text-gray-900">Kanban Board</p>
              <p className="text-xs text-gray-600">Manage tasks</p>
            </Link>
            
            <Link 
              to="/projects" 
              className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-center"
            >
              <Components.ChartIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="font-medium text-gray-900">Gantt Chart</p>
              <p className="text-xs text-gray-600">Timeline view</p>
            </Link>
            
            <Link 
              to="/projects" 
              className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-center"
            >
              <Components.ResourceIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="font-medium text-gray-900">Resources</p>
              <p className="text-xs text-gray-600">Team allocation</p>
            </Link>
            
            <Link 
              to="/tasks" 
              className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-center"
            >
              <Components.UserIcon className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <p className="font-medium text-gray-900">My Tasks</p>
              <p className="text-xs text-gray-600">Independent tasks</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// User Registration/Profile Management Component
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
          <Components.UserIcon className="h-5 w-5 inline mr-2" />
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
                  <Components.UserIcon className="h-6 w-6 text-purple-600" />
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
                  <Components.EditIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deleteUser(user.id)}
                  className="text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete User"
                >
                  <Components.DeleteIcon className="h-4 w-4" />
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
          <Components.UserIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
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
const TaskManagement = () => {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assigned_to: '',
    due_date: '',
    estimated_hours: ''
  });

  useEffect(() => {
    fetchTasks();
    fetchUsers();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${API}/tasks?project_id=independent`);
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/users`);
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const createTask = async (e) => {
    e.preventDefault();
    try {
      const taskData = {
        ...newTask,
        due_date: newTask.due_date ? new Date(newTask.due_date).toISOString() : null,
        estimated_hours: newTask.estimated_hours ? parseFloat(newTask.estimated_hours) : null,
        assigned_to: newTask.assigned_to || null
      };
      
      await axios.post(`${API}/tasks`, taskData);
      setNewTask({ title: '', description: '', priority: 'medium', assigned_to: '', due_date: '', estimated_hours: '' });
      setShowCreateTask(false);
      fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      await axios.put(`${API}/tasks/${taskId}`, { status: newStatus });
      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await axios.delete(`${API}/tasks/${taskId}`);
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task. Please try again.');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Task Management</h1>
          <p className="text-gray-600">Independent tasks not tied to specific projects</p>
        </div>
        <button
          onClick={() => setShowCreateTask(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
        >
          Create Task
        </button>
      </div>

      {/* Task Creation Modal */}
      {showCreateTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md m-4">
            <h3 className="text-xl font-semibold mb-4">Create New Task</h3>
            <form onSubmit={createTask} className="space-y-4">
              <input
                type="text"
                placeholder="Task Title"
                value={newTask.title}
                onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
              <textarea
                placeholder="Description"
                value={newTask.description}
                onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent h-24"
                required
              />
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="critical">Critical Priority</option>
              </select>
              <select
                value={newTask.assigned_to}
                onChange={(e) => setNewTask({...newTask, assigned_to: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Unassigned</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name} ({user.role.replace('_', ' ')})</option>
                ))}
              </select>
              <input
                type="date"
                value={newTask.due_date}
                onChange={(e) => setNewTask({...newTask, due_date: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <input
                type="number"
                placeholder="Estimated Hours"
                value={newTask.estimated_hours}
                onChange={(e) => setNewTask({...newTask, estimated_hours: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                step="0.5"
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-medium transition-colors"
                >
                  Create Task
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateTask(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tasks.map(task => (
          <Components.TaskCard 
            key={task.id} 
            task={task} 
            users={users} 
            onStatusChange={updateTaskStatus}
            onDelete={deleteTask}
          />
        ))}
      </div>

      {tasks.length === 0 && (
        <div className="text-center py-12">
          <Components.TaskIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Tasks Yet</h3>
          <p className="text-gray-600 mb-4">Create your first independent task to get started</p>
        </div>
      )}
    </div>
  );
};

// Project Management Component with Gantt and Resource Views
const ProjectManagement = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [currentView, setCurrentView] = useState('kanban'); // kanban, gantt, resources
  const [kanbanData, setKanbanData] = useState({ todo: [], in_progress: [], review: [], done: [] });
  const [ganttData, setGanttData] = useState(null);
  const [resourceData, setResourceData] = useState(null);
  const [users, setUsers] = useState([]);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    project_manager_id: ''
  });
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assigned_to: '',
    due_date: '',
    estimated_hours: '',
    start_date: '',
    end_date: '',
    duration_days: '',
    is_milestone: false,
    story_points: null
  });

  useEffect(() => {
    fetchProjects();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchProjectData(selectedProject.id);
    }
  }, [selectedProject, currentView]);

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API}/projects`);
      setProjects(response.data);
      if (response.data.length > 0 && !selectedProject) {
        setSelectedProject(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/users`);
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchProjectData = async (projectId) => {
    try {
      if (currentView === 'kanban') {
        const response = await axios.get(`${API}/projects/${projectId}/kanban`);
        setKanbanData(response.data);
      } else if (currentView === 'gantt') {
        const response = await axios.get(`${API}/projects/${projectId}/gantt`);
        setGanttData(response.data);
      } else if (currentView === 'resources') {
        const response = await axios.get(`${API}/projects/${projectId}/resources`);
        setResourceData(response.data);
      }
    } catch (error) {
      console.error('Error fetching project data:', error);
    }
  };

  const createProject = async (e) => {
    e.preventDefault();
    try {
      const projectData = {
        ...newProject,
        start_date: new Date(newProject.start_date).toISOString(),
        end_date: newProject.end_date ? new Date(newProject.end_date).toISOString() : null
      };
      
      await axios.post(`${API}/projects`, projectData);
      setNewProject({ name: '', description: '', start_date: '', end_date: '', project_manager_id: '' });
      setShowCreateProject(false);
      fetchProjects();
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const createTask = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;
    
    try {
      const taskData = {
        ...newTask,
        project_id: selectedProject.id,
        due_date: newTask.due_date ? new Date(newTask.due_date).toISOString() : null,
        start_date: newTask.start_date ? new Date(newTask.start_date).toISOString() : null,
        end_date: newTask.end_date ? new Date(newTask.end_date).toISOString() : null,
        estimated_hours: newTask.estimated_hours ? parseFloat(newTask.estimated_hours) : null,
        duration_days: newTask.duration_days ? parseFloat(newTask.duration_days) : null,
        assigned_to: newTask.assigned_to || null
      };
      
      await axios.post(`${API}/tasks`, taskData);
      setNewTask({ 
        title: '', description: '', priority: 'medium', assigned_to: '', 
        due_date: '', estimated_hours: '', start_date: '', end_date: '', 
        duration_days: '', is_milestone: false, story_points: null 
      });
      setShowCreateTask(false);
      fetchProjectData(selectedProject.id);
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      await axios.put(`${API}/tasks/${taskId}`, { status: newStatus });
      
      // Always refresh kanban data when task status changes
      if (selectedProject) {
        const response = await axios.get(`${API}/projects/${selectedProject.id}/kanban`);
        setKanbanData(response.data);
        
        // Also refresh other views if they're currently active
        if (currentView === 'gantt') {
          const ganttResponse = await axios.get(`${API}/projects/${selectedProject.id}/gantt`);
          setGanttData(ganttResponse.data);
        } else if (currentView === 'resources') {
          const resourceResponse = await axios.get(`${API}/projects/${selectedProject.id}/resources`);
          setResourceData(resourceResponse.data);
        }
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await axios.delete(`${API}/tasks/${taskId}`);
      
      // Always refresh kanban data when task is deleted
      if (selectedProject) {
        const response = await axios.get(`${API}/projects/${selectedProject.id}/kanban`);
        setKanbanData(response.data);
        
        // Also refresh other views if they're currently active
        if (currentView === 'gantt') {
          const ganttResponse = await axios.get(`${API}/projects/${selectedProject.id}/gantt`);
          setGanttData(ganttResponse.data);
        } else if (currentView === 'resources') {
          const resourceResponse = await axios.get(`${API}/projects/${selectedProject.id}/resources`);
          setResourceData(resourceResponse.data);
        }
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task. Please try again.');
    }
  };

  const deleteProject = async (projectId, force = false) => {
    try {
      const endpoint = force ? `${API}/projects/${projectId}/force` : `${API}/projects/${projectId}`;
      await axios.delete(endpoint);
      
      // Remove from state and select another project
      const remainingProjects = projects.filter(p => p.id !== projectId);
      setProjects(remainingProjects);
      
      if (selectedProject && selectedProject.id === projectId) {
        setSelectedProject(remainingProjects.length > 0 ? remainingProjects[0] : null);
      }
      
      fetchProjects(); // Refresh the list
    } catch (error) {
      console.error('Error deleting project:', error);
      if (error.response && error.response.status === 400) {
        // Project has tasks, suggest force delete
        const errorMessage = error.response.data.detail;
        const confirmForce = window.confirm(`${errorMessage}\n\nWould you like to force delete the project and all its tasks?`);
        if (confirmForce) {
          deleteProject(projectId, true);
        }
      } else {
        alert('Failed to delete project. Please try again.');
      }
    }
  };

  const renderCurrentView = () => {
    if (!selectedProject) return null;

    switch (currentView) {
      case 'kanban':
        return <Components.DragDropKanbanBoard kanbanData={kanbanData} users={users} epics={[]} sprints={[]} onStatusChange={updateTaskStatus} onDelete={deleteTask} />;
      case 'gantt':
        return <Components.GanttChart ganttData={ganttData} users={users} />;
      case 'resources':
        return <Components.ResourceManagement resources={resourceData} />;
      default:
        return <Components.DragDropKanbanBoard kanbanData={kanbanData} users={users} epics={[]} sprints={[]} onStatusChange={updateTaskStatus} onDelete={deleteTask} />;
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Project Management</h1>
          <p className="text-gray-600">Advanced project planning with Gantt charts and resource management</p>
        </div>
        <div className="flex gap-3">
          {selectedProject && (
            <button
              onClick={() => setShowCreateTask(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
            >
              Add Task
            </button>
          )}
          <button
            onClick={() => setShowCreateProject(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            Create Project
          </button>
        </div>
      </div>

      {/* Project Selection */}
      {projects.length > 0 && (
        <div className="mb-6">
          <div className="flex gap-2 flex-wrap">
            {projects.map(project => (
              <div key={project.id} className="flex items-center bg-gray-100 rounded-full">
                <button
                  onClick={() => setSelectedProject(project)}
                  className={`px-4 py-2 rounded-l-full text-sm font-medium transition-colors ${
                    selectedProject?.id === project.id
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {project.name}
                </button>
                <button
                  onClick={() => deleteProject(project.id)}
                  className="px-2 py-2 text-gray-400 hover:text-red-600 transition-colors rounded-r-full hover:bg-red-50"
                  title="Delete Project"
                >
                  <Components.DeleteIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View Toggle */}
      {selectedProject && (
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setCurrentView('kanban')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentView === 'kanban' 
                  ? 'bg-white text-purple-700 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Components.TaskIcon className="h-4 w-4 inline mr-2" />
              Kanban Board
            </button>
            <button
              onClick={() => setCurrentView('gantt')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentView === 'gantt' 
                  ? 'bg-white text-purple-700 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Components.ChartIcon className="h-4 w-4 inline mr-2" />
              Gantt Chart
            </button>
            <button
              onClick={() => setCurrentView('resources')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentView === 'resources' 
                  ? 'bg-white text-purple-700 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Components.ResourceIcon className="h-4 w-4 inline mr-2" />
              Resources
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Task Creation Modal */}
      {showCreateTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Add Task to {selectedProject?.name}</h3>
            <form onSubmit={createTask} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Task Title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  className="col-span-2 w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
                <textarea
                  placeholder="Description"
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  className="col-span-2 w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent h-24"
                  required
                />
                
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                  <option value="critical">Critical Priority</option>
                </select>
                
                <select
                  value={newTask.assigned_to}
                  onChange={(e) => setNewTask({...newTask, assigned_to: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Unassigned</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name} ({user.role.replace('_', ' ')})</option>
                  ))}
                </select>

                <input
                  type="date"
                  placeholder="Start Date"
                  value={newTask.start_date}
                  onChange={(e) => setNewTask({...newTask, start_date: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                
                <input
                  type="date"
                  placeholder="End Date"
                  value={newTask.end_date}
                  onChange={(e) => setNewTask({...newTask, end_date: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />

                <input
                  type="number"
                  placeholder="Duration (days)"
                  value={newTask.duration_days}
                  onChange={(e) => setNewTask({...newTask, duration_days: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  step="0.5"
                />
                
                <input
                  type="number"
                  placeholder="Estimated Hours"
                  value={newTask.estimated_hours}
                  onChange={(e) => setNewTask({...newTask, estimated_hours: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  step="0.5"
                />

                <input
                  type="date"
                  placeholder="Due Date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({...newTask, due_date: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_milestone"
                    checked={newTask.is_milestone}
                    onChange={(e) => setNewTask({...newTask, is_milestone: e.target.checked})}
                    className="mr-2"
                  />
                  <label htmlFor="is_milestone" className="text-sm text-gray-700">Mark as Milestone</label>
                </div>

                <input
                  type="number"
                  placeholder="Story Points (Optional)"
                  value={newTask.story_points || ''}
                  onChange={(e) => setNewTask({...newTask, story_points: e.target.value ? parseInt(e.target.value) : null})}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  min="1"
                  max="100"
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-medium transition-colors"
                >
                  Add Task
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateTask(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Creation Modal - Keep existing */}
      {showCreateProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md m-4">
            <h3 className="text-xl font-semibold mb-4">Create New Project</h3>
            <form onSubmit={createProject} className="space-y-4">
              <input
                type="text"
                placeholder="Project Name"
                value={newProject.name}
                onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
              <textarea
                placeholder="Description"
                value={newProject.description}
                onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent h-24"
                required
              />
              <input
                type="date"
                placeholder="Start Date"
                value={newProject.start_date}
                onChange={(e) => setNewProject({...newProject, start_date: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
              <input
                type="date"
                placeholder="End Date"
                value={newProject.end_date}
                onChange={(e) => setNewProject({...newProject, end_date: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <select
                value={newProject.project_manager_id}
                onChange={(e) => setNewProject({...newProject, project_manager_id: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              >
                <option value="">Select Project Manager</option>
                {users.filter(user => ['project_manager', 'engineering_manager'].includes(user.role)).map(user => (
                  <option key={user.id} value={user.id}>{user.name} ({user.role.replace('_', ' ')})</option>
                ))}
              </select>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-medium transition-colors"
                >
                  Create Project
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateProject(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Render Current View */}
      {selectedProject ? renderCurrentView() : (
        <div className="text-center py-12">
          <Components.ProjectIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Projects Yet</h3>
          <p className="text-gray-600 mb-4">Create your first project to start managing tasks with advanced project management features</p>
        </div>
      )}
    </div>
  );
};

// Main App Navigation
const Navigation = ({ currentPage, setCurrentPage }) => {
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center">
                <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  PMFusion
                </h2>
                <span className="ml-2 text-xs text-gray-500 bg-purple-100 px-2 py-1 rounded-full">EPC</span>
              </Link>
            </div>
            <div className="ml-10 flex items-baseline space-x-4">
              <button
                onClick={() => setCurrentPage('dashboard')}
                className={`nav-item ${currentPage === 'dashboard' ? 'nav-item-active' : 'nav-item-inactive'}`}
              >
                <Components.ChartIcon className="h-4 w-4 inline mr-1" />
                Dashboard
              </button>
              <button
                onClick={() => setCurrentPage('tasks')}
                className={`nav-item ${currentPage === 'tasks' ? 'nav-item-active' : 'nav-item-inactive'}`}
              >
                <Components.TaskIcon className="h-4 w-4 inline mr-1" />
                Tasks
              </button>
              <button
                onClick={() => setCurrentPage('projects')}
                className={`nav-item ${currentPage === 'projects' ? 'nav-item-active' : 'nav-item-inactive'}`}
              >
                <Components.ProjectIcon className="h-4 w-4 inline mr-1" />
                Projects
              </button>
              <button
                onClick={() => setCurrentPage('users')}
                className={`nav-item ${currentPage === 'users' ? 'nav-item-active' : 'nav-item-inactive'}`}
              >
                <Components.UserIcon className="h-4 w-4 inline mr-1" />
                Team
              </button>
              <button
                onClick={() => setCurrentPage('documents')}
                className={`nav-item ${currentPage === 'documents' ? 'nav-item-active' : 'nav-item-inactive'}`}
              >
                <Components.DocumentIcon className="h-4 w-4 inline mr-1" />
                Documents
              </button>
            </div>
          </div>
          <div className="flex items-center">
            <Link
              to="/"
              className="text-gray-500 hover:text-gray-700 text-sm font-medium"
            >
              <Components.UserIcon className="h-4 w-4 inline mr-1" />
              Home
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  const renderPage = () => {
    switch (currentPage) {
      case 'tasks':
        return <TaskManagement />;
      case 'projects':
        return <ProjectManagement />;
      case 'dashboard':
        return <Dashboard />;
      case 'users':
        return <UserManagement />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="App min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={
          <>
            <Navigation currentPage="dashboard" setCurrentPage={setCurrentPage} />
            <main><Dashboard /></main>
          </>
        } />
        <Route path="/tasks" element={
          <>
            <Navigation currentPage="tasks" setCurrentPage={setCurrentPage} />
            <main><TaskManagement /></main>
          </>
        } />
        <Route path="/projects" element={
          <>
            <Navigation currentPage="projects" setCurrentPage={setCurrentPage} />
            <main><ProjectManagement /></main>
          </>
        } />
        <Route path="/users" element={
          <>
            <Navigation currentPage="users" setCurrentPage={setCurrentPage} />
            <main><UserManagement /></main>
          </>
        } />
        <Route path="/documents" element={
          <>
            <Navigation currentPage="documents" setCurrentPage={setCurrentPage} />
            <main><Components.DocumentManagement /></main>
          </>
        } />
      </Routes>
    </div>
  );
}

export default App;