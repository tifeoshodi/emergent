import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Link, useNavigate } from "react-router-dom";
import axios from "axios";
// Set user ID after authentication
// axios.defaults.headers.common["X-User-ID"] = authenticatedUserId;
import Components from "./Components";
import WBSGenerator from "./WBSGenerator";

const currentUser = { role: "scheduler" };

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const API = `${BACKEND_URL}/api`;

// Maximum number of retries for API calls
const MAX_RETRIES = 3;

// Home Page Component
const HomePage = () => {
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connecting', 'connected', 'error'
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      // First, check if the API is available
      const healthCheck = await axios.get(`${API}/`);
      if (healthCheck.status === 200) {
        // API is available, now fetch the data
        const [statsRes, tasksRes, projectsRes] = await Promise.all([
          axios.get(`${API}/dashboard/stats`),
          axios.get(`${API}/tasks`),
          axios.get(`${API}/projects`)
        ]);
        
        setStats(statsRes.data);
        setConnectionStatus('connected');
        // Reset retry count on successful connection
        setRetryCount(0);
        
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
      }
    } catch (error) {
      console.error('Error fetching home data:', error);
      setConnectionStatus('error');
      
      // Check if we've reached the maximum number of retries
      if (retryCount < MAX_RETRIES) {
        // Try to fetch data individually if the bulk fetch failed
        try {
          const statsRes = await axios.get(`${API}/dashboard/stats`);
          setStats(statsRes.data);
          setConnectionStatus('connected');
          // Reset retry count on successful connection
          setRetryCount(0);
        } catch (statsError) {
          console.error('Stats API still failing:', statsError);
          setConnectionStatus('error');
          // Increment retry count
          setRetryCount(prevCount => prevCount + 1);
          // Only show fallback demo data if individual API calls also fail
          setStats({
            total_projects: 0,
            active_projects: 0,
            total_tasks: 0,
            completed_tasks: 0,
            in_progress_tasks: 0,
            overdue_tasks: 0,
            my_tasks: 0
          });
        }
        
        // Try to get real project data for recent activity
        try {
          const projectsRes = await axios.get(`${API}/projects`);
          const activity = projectsRes.data.slice(0, 5).map(project => ({
            type: 'project', 
            title: project.name,
            status: project.status,
            created_at: project.created_at
          }));
          setRecentActivity(activity);
        } catch (activityError) {
          console.error('Projects API failing:', activityError);
          setRecentActivity([]);
        }
      } else {
        console.warn(`Maximum retry attempts (${MAX_RETRIES}) reached. Giving up.`);
        // Set fallback data after max retries
        setStats({
          total_projects: 0,
          active_projects: 0,
          total_tasks: 0,
          completed_tasks: 0,
          in_progress_tasks: 0,
          overdue_tasks: 0,
          my_tasks: 0
        });
        setRecentActivity([]);
      }
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
              <Link 
                to="/documents" 
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl font-semibold transition-colors text-lg"
              >
                Documents
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mr-4">Platform Overview</h2>
          <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            connectionStatus === 'connected' 
              ? 'bg-green-100 text-green-800' 
              : connectionStatus === 'error'
              ? 'bg-red-100 text-red-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${
              connectionStatus === 'connected' 
                ? 'bg-green-400' 
                : connectionStatus === 'error'
                ? 'bg-red-400'
                : 'bg-yellow-400'
            }`}></div>
            {connectionStatus === 'connected' && 'Live Database Data'}
            {connectionStatus === 'error' && 'Database Connection Error'}
            {connectionStatus === 'connecting' && 'Connecting to Database...'}
          </div>
          {connectionStatus === 'error' && (
            <button 
              onClick={fetchHomeData}
              className="ml-3 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
            >
              Retry Connection
            </button>
          )}
        </div>
        
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
  const [disciplines, setDisciplines] = useState([]);
  const [selectedDiscipline, setSelectedDiscipline] = useState('');
  const [disciplineData, setDisciplineData] = useState(null);

  useEffect(() => {
    fetchProjects();
    fetchDisciplines();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchDashboardData(selectedProject.id);
    }
  }, [selectedProject]);

  useEffect(() => {
    if (selectedDiscipline) {
      fetchDisciplineData(selectedDiscipline);
    }
  }, [selectedDiscipline]);

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

  const fetchDisciplines = async () => {
    try {
      const res = await axios.get(`${API}/users`);
      const unique = [...new Set(res.data.map(u => u.discipline).filter(Boolean))];
      setDisciplines(unique);
      if (unique.length > 0 && !selectedDiscipline) {
        setSelectedDiscipline(unique[0]);
      }
    } catch (e) {
      console.error('Error fetching disciplines:', e);
    }
  };

  const fetchDisciplineData = async (discipline) => {
    try {
      const res = await axios.get(`${API}/dashboard/discipline`, { params: { discipline } });
      setDisciplineData(res.data);
    } catch (e) {
      console.error('Error fetching discipline data:', e);
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

      {/* Discipline Metrics */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mt-8">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="text-lg font-semibold text-gray-900">Discipline Overview</h3>
          <select
            value={selectedDiscipline}
            onChange={(e) => setSelectedDiscipline(e.target.value)}
            className="border-gray-300 rounded-md text-sm"
          >
            {disciplines.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        {disciplineData && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {Object.entries(disciplineData.tasks_by_status).map(([status, count]) => (
                <div key={status} className="p-4 bg-gray-50 rounded">
                  <p className="text-sm text-gray-600 capitalize">{status.replace('_',' ')}</p>
                  <p className="text-xl font-bold text-gray-900">{count}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-700 mb-2">Milestone Completion: {disciplineData.milestone_completion_percent.toFixed(1)}%</p>
            <p className="text-sm text-gray-700 mb-4">Resource Utilization: {disciplineData.resource_utilization_percent.toFixed(1)}%</p>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Active Projects</h4>
              <ul className="divide-y divide-gray-200">
                {disciplineData.projects.map(p => (
                  <li key={p.project_id} className="py-1 flex justify-between text-sm">
                    <span>{p.project_name}</span>
                    <span>{Math.round(p.progress_percent)}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
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
  const [kanbanData, setKanbanData] = useState({
    todo: [],
    in_progress: [],
    review: [],
    done: []
  });
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
      // Fetch tasks that are not associated with any project
      const response = await axios.get(`${API}/tasks?independent=true`);

      const board = { todo: [], in_progress: [], review: [], done: [] };
      response.data.forEach(task => {
        if (board[task.status]) {
          board[task.status].push(task);
        }
      });

      setKanbanData(board);
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

  const handleDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination ||
        (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }

    const sourceCol = source.droppableId;
    const destCol = destination.droppableId;

    const movedItem = kanbanData[sourceCol][source.index];
    const newSourceItems = Array.from(kanbanData[sourceCol]);
    newSourceItems.splice(source.index, 1);
    const newDestItems = Array.from(kanbanData[destCol]);
    newDestItems.splice(destination.index, 0, movedItem);

    setKanbanData(prev => ({
      ...prev,
      [sourceCol]: newSourceItems,
      [destCol]: newDestItems
    }));
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

      <Components.DragDropKanbanBoard
        kanbanData={kanbanData}
        users={users}
        onStatusChange={updateTaskStatus}
        onDragEnd={handleDragEnd}
        onDelete={deleteTask}
      />

      {Object.values(kanbanData).every(col => col.length === 0) && (
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

  const handleDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination ||
        (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }

    const sourceCol = source.droppableId;
    const destCol = destination.droppableId;

    const movedItem = kanbanData[sourceCol][source.index];
    const newSourceItems = Array.from(kanbanData[sourceCol]);
    newSourceItems.splice(source.index, 1);
    const newDestItems = Array.from(kanbanData[destCol]);
    newDestItems.splice(destination.index, 0, movedItem);

    setKanbanData(prev => ({
      ...prev,
      [sourceCol]: newSourceItems,
      [destCol]: newDestItems
    }));
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
        return <Components.DragDropKanbanBoard kanbanData={kanbanData} users={users} epics={[]} sprints={[]} onStatusChange={updateTaskStatus} onDragEnd={handleDragEnd} onDelete={deleteTask} />;
      case 'gantt':
        return <Components.GanttChart ganttData={ganttData} users={users} />;
      case 'resources':
        return <Components.ResourceManagement resources={resourceData} />;
      default:
        return <Components.DragDropKanbanBoard kanbanData={kanbanData} users={users} epics={[]} sprints={[]} onStatusChange={updateTaskStatus} onDragEnd={handleDragEnd} onDelete={deleteTask} />;
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

// Document Management Component
const DocumentManagementPage = () => {
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    discipline: '',
    search: ''
  });
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    category: '',
    discipline: '',
    document_number: '',
    is_confidential: false,
    tags: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // EPC Document Categories
  const documentCategories = [
    { value: 'engineering_drawing', label: 'Engineering Drawing' },
    { value: 'piping_drawing', label: 'P&ID Drawing' },
    { value: 'electrical_drawing', label: 'Electrical Drawing' },
    { value: 'instrument_drawing', label: 'Instrument Drawing' },
    { value: 'technical_specification', label: 'Technical Specification' },
    { value: 'project_report', label: 'Project Report' },
    { value: 'safety_document', label: 'Safety Document' },
    { value: 'compliance_document', label: 'Compliance Document' },
    { value: 'meeting_minutes', label: 'Meeting Minutes' },
    { value: 'vendor_document', label: 'Vendor Document' },
    { value: 'as_built_document', label: 'As-Built Document' },
    { value: 'procedure', label: 'Procedure' },
    { value: 'manual', label: 'Manual' },
    { value: 'certificate', label: 'Certificate' },
    { value: 'other', label: 'Other' }
  ];

  const documentStatuses = [
    { value: 'draft', label: 'Draft' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'superseded', label: 'Superseded' },
    { value: 'archived', label: 'Archived' }
  ];

  const disciplines = [
    'Mechanical Engineering',
    'Electrical Engineering',
    'Process Engineering',
    'Civil Engineering',
    'Instrumentation & Control',
    'Piping Engineering',
    'Safety Engineering',
    'Environmental Engineering'
  ];

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [documents, filters]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/documents`);
      setDocuments(response.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...documents];

    if (filters.category) {
      filtered = filtered.filter(doc => doc.category === filters.category);
    }
    if (filters.status) {
      filtered = filtered.filter(doc => doc.status === filters.status);
    }
    if (filters.discipline) {
      filtered = filtered.filter(doc => doc.discipline === filters.discipline);
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(searchLower) ||
        doc.description.toLowerCase().includes(searchLower) ||
        (doc.document_number && doc.document_number.toLowerCase().includes(searchLower)) ||
        doc.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    setFilteredDocuments(filtered);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    if (file && !uploadData.title) {
      // Auto-populate title from filename
      const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, "");
      setUploadData(prev => ({ ...prev, title: nameWithoutExtension }));
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please select a file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', uploadData.title);
    formData.append('description', uploadData.description);
    formData.append('category', uploadData.category);
    if (uploadData.discipline) formData.append('discipline', uploadData.discipline);
    if (uploadData.document_number) formData.append('document_number', uploadData.document_number);
    formData.append('is_confidential', uploadData.is_confidential);
    formData.append('tags', uploadData.tags);

    try {
      setUploadProgress(10);
      const response = await axios.post(`${API}/documents/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });

      if (response.status === 200) {
        setShowUploadModal(false);
        setUploadData({
          title: '', description: '', category: '', discipline: '', 
          document_number: '', is_confidential: false, tags: ''
        });
        setSelectedFile(null);
        setUploadProgress(0);
        fetchDocuments();
        alert('Document uploaded successfully!');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      alert(`Upload failed: ${error.response?.data?.detail || 'Please try again'}`);
      setUploadProgress(0);
    }
  };

  const handleDownload = async (documentId, fileName) => {
    try {
      const response = await axios.get(`${API}/documents/${documentId}/download`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Download failed. Please try again.');
    }
  };

  const handleStatusUpdate = async (documentId, newStatus) => {
    try {
      await axios.put(`${API}/documents/${documentId}/status`, { status: newStatus });
      fetchDocuments();
      alert(`Document status updated to ${newStatus.replace('_', ' ')}`);
    } catch (error) {
      console.error('Error updating document status:', error);
      alert('Status update failed. Please try again.');
    }
  };

  const handleDelete = async (documentId) => {
    if (window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      try {
        await axios.delete(`${API}/documents/${documentId}`);
        fetchDocuments();
        alert('Document deleted successfully');
      } catch (error) {
        console.error('Error deleting document:', error);
        alert('Delete failed. Please try again.');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'superseded': return 'bg-orange-100 text-orange-800';
      case 'archived': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'engineering_drawing':
      case 'piping_drawing':
      case 'electrical_drawing':
      case 'instrument_drawing':
        return 'bg-purple-100 text-purple-800';
      case 'safety_document': return 'bg-red-100 text-red-800';
      case 'compliance_document': return 'bg-indigo-100 text-indigo-800';
      case 'technical_specification': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCategoryLabel = (categoryValue) => {
    const category = documentCategories.find(c => c.value === categoryValue);
    return category ? category.label : categoryValue.replace('_', ' ').toUpperCase();
  };

  const getStatusLabel = (statusValue) => {
    const status = documentStatuses.find(s => s.value === statusValue);
    return status ? status.label : statusValue.replace('_', ' ').toUpperCase();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Document Management</h1>
          <p className="text-gray-600">Manage engineering documents, drawings, and compliance files</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
        >
          <Components.UploadIcon className="h-5 w-5 inline mr-2" />
          Upload Document
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <div className="relative">
            <Components.SearchIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <select
            value={filters.category}
            onChange={(e) => setFilters({...filters, category: e.target.value})}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {documentCategories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            {documentStatuses.map(status => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>

          <select
            value={filters.discipline}
            onChange={(e) => setFilters({...filters, discipline: e.target.value})}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">All Disciplines</option>
            {disciplines.map(discipline => (
              <option key={discipline} value={discipline}>{discipline}</option>
            ))}
          </select>

          <button
            onClick={() => setFilters({ category: '', status: '', discipline: '', search: '' })}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading documents...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map(document => (
            <div key={document.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <Components.DocumentIcon className="h-8 w-8 text-purple-600 flex-shrink-0" />
                <div className="flex gap-2">
                  {document.is_confidential && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                      Confidential
                    </span>
                  )}
                  <button
                    onClick={() => handleDelete(document.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete Document"
                  >
                    <Components.DeleteIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{document.title}</h3>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{document.description}</p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(document.category)}`}>
                    {getCategoryLabel(document.category)}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(document.status)}`}>
                    {getStatusLabel(document.status)}
                  </span>
                </div>

                {document.discipline && (
                  <div className="text-sm text-gray-600">
                    <strong>Discipline:</strong> {document.discipline}
                  </div>
                )}

                {document.document_number && (
                  <div className="text-sm text-gray-600">
                    <strong>Doc #:</strong> {document.document_number}
                  </div>
                )}

                <div className="text-sm text-gray-600">
                  <strong>Size:</strong> {formatFileSize(document.file_size)} • <strong>Version:</strong> {document.version}
                </div>

                {document.tags && document.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {document.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-xs rounded">
                        {tag}
                      </span>
                    ))}
                    {document.tags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-xs rounded">
                        +{document.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => handleDownload(document.id, document.file_name)}
                  className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                >
                  <Components.DownloadIcon className="h-4 w-4 inline mr-1" />
                  Download
                </button>

                {document.status !== 'approved' && (
                  <button
                    onClick={() => handleStatusUpdate(document.id, 'approved')}
                    className="bg-green-100 hover:bg-green-200 text-green-700 py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                    title="Approve Document"
                  >
                    <Components.ApprovalIcon className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Status Actions */}
              {document.status === 'draft' && (
                <div className="flex gap-1">
                  <button
                    onClick={() => handleStatusUpdate(document.id, 'under_review')}
                    className="flex-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 py-1 px-2 rounded text-xs transition-colors"
                  >
                    Submit for Review
                  </button>
                </div>
              )}

              {document.status === 'under_review' && (
                <div className="flex gap-1">
                  <button
                    onClick={() => handleStatusUpdate(document.id, 'draft')}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-2 rounded text-xs transition-colors"
                  >
                    Return to Draft
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(document.id, 'approved')}
                    className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 py-1 px-2 rounded text-xs transition-colors"
                  >
                    Approve
                  </button>
                </div>
              )}

              <div className="mt-3 text-xs text-gray-500">
                Created: {new Date(document.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredDocuments.length === 0 && !loading && (
        <div className="text-center py-12">
          <Components.DocumentIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {documents.length === 0 ? "No Documents Yet" : "No Documents Found"}
          </h3>
          <p className="text-gray-600 mb-4">
            {documents.length === 0 ? "Upload your first engineering document to get started" : "Try adjusting your filters"}
          </p>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Upload Document</h3>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Document Title"
                  value={uploadData.title}
                  onChange={(e) => setUploadData({...uploadData, title: e.target.value})}
                  className="col-span-2 w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />

                <textarea
                  placeholder="Description"
                  value={uploadData.description}
                  onChange={(e) => setUploadData({...uploadData, description: e.target.value})}
                  className="col-span-2 w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent h-24"
                  required
                />

                <select
                  value={uploadData.category}
                  onChange={(e) => setUploadData({...uploadData, category: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Category</option>
                  {documentCategories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>

                <select
                  value={uploadData.discipline}
                  onChange={(e) => setUploadData({...uploadData, discipline: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select Discipline (Optional)</option>
                  {disciplines.map(discipline => (
                    <option key={discipline} value={discipline}>{discipline}</option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Document Number (Optional)"
                  value={uploadData.document_number}
                  onChange={(e) => setUploadData({...uploadData, document_number: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />

                <input
                  type="text"
                  placeholder="Tags (comma-separated)"
                  value={uploadData.tags}
                  onChange={(e) => setUploadData({...uploadData, tags: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />

                <div className="col-span-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={uploadData.is_confidential}
                      onChange={(e) => setUploadData({...uploadData, is_confidential: e.target.checked})}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Mark as Confidential</span>
                  </label>
                </div>

                <div className="col-span-2">
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.dwg,.jpg,.png,.txt"
                    required
                  />
                  {selectedFile && (
                    <p className="text-sm text-gray-600 mt-2">
                      Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                    </p>
                  )}
                </div>

                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="col-span-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Uploading... {uploadProgress}%</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={uploadProgress > 0 && uploadProgress < 100}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white py-3 rounded-xl font-medium transition-colors"
                >
                  {uploadProgress > 0 && uploadProgress < 100 ? 'Uploading...' : 'Upload Document'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadProgress(0);
                    setSelectedFile(null);
                  }}
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

// Document Control Center View
const DocumentControlCenter = () => {
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await axios.get(`${API}/documents/dcc`);
      setDocuments(res.data);
    } catch (err) {
      console.error('Failed fetching DCC documents', err);
    }
  };

  const finalizeDocument = async (id) => {
    try {
      await axios.post(`${API}/documents/${id}/dcc_finalize`);
      fetchDocuments();
      alert('Document finalized and sent to client');
    } catch (err) {
      console.error('Finalize failed', err);
      alert('Finalize failed');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Document Control Center</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.map(doc => (
          <div key={doc.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold mb-2">{doc.title}</h3>
            <p className="text-sm text-gray-600 mb-4">{doc.description}</p>
            <button
              onClick={() => finalizeDocument(doc.id)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Send to Client
            </button>
          </div>
        ))}
      </div>
      {documents.length === 0 && (
        <p className="text-gray-600">No documents awaiting control.</p>
      )}
    </div>
  );
};
const Navigation = ({ currentPage }) => {
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
              <Link
                to="/dashboard"
                className={`nav-item ${currentPage === 'dashboard' ? 'nav-item-active' : 'nav-item-inactive'}`}
              >
                <Components.ChartIcon className="h-4 w-4 inline mr-1" />
                Dashboard
              </Link>
              <Link
                to="/tasks"
                className={`nav-item ${currentPage === 'tasks' ? 'nav-item-active' : 'nav-item-inactive'}`}
              >
                <Components.TaskIcon className="h-4 w-4 inline mr-1" />
                Tasks
              </Link>
              <Link
                to="/projects"
                className={`nav-item ${currentPage === 'projects' ? 'nav-item-active' : 'nav-item-inactive'}`}
              >
                <Components.ProjectIcon className="h-4 w-4 inline mr-1" />
                Projects
              </Link>
              <Link
                to="/users"
                className={`nav-item ${currentPage === 'users' ? 'nav-item-active' : 'nav-item-inactive'}`}
              >
                <Components.UserIcon className="h-4 w-4 inline mr-1" />
                Team
              </Link>
              <Link
                to="/documents"
                className={`nav-item ${currentPage === 'documents' ? 'nav-item-active' : 'nav-item-inactive'}`}
              >
                <Components.DocumentIcon className="h-4 w-4 inline mr-1" />
                Documents
              </Link>
              {currentUser.role === 'scheduler' && (
                <Link
                  to="/wbs"
                  className={`nav-item ${currentPage === 'wbs' ? 'nav-item-active' : 'nav-item-inactive'}`}
                >
                  <Components.ChartIcon className="h-4 w-4 inline mr-1" />
                  WBS Generator
                </Link>
              )}
              <Link
                to="/dcc"
                className={`nav-item ${currentPage === 'dcc' ? 'nav-item-active' : 'nav-item-inactive'}`}
              >
                <Components.DocumentIcon className="h-4 w-4 inline mr-1" />
                Control Center
              </Link>
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

  return (
    <div className="App min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={
          <>
            <Navigation currentPage="dashboard" />
            <main><Dashboard /></main>
          </>
        } />
        <Route path="/tasks" element={
          <>
            <Navigation currentPage="tasks" />
            <main><TaskManagement /></main>
          </>
        } />
        <Route path="/projects" element={
          <>
            <Navigation currentPage="projects" />
            <main><ProjectManagement /></main>
          </>
        } />
        <Route path="/users" element={
          <>
            <Navigation currentPage="users" />
            <main><UserManagement /></main>
          </>
        } />
        <Route path="/documents" element={
          <>
            <Navigation currentPage="documents" />
            <main><DocumentManagementPage /></main>
          </>
        } />
        <Route path="/dcc" element={
          <>
            <Navigation currentPage="dcc" />
            <main><DocumentControlCenter /></main>
          </>
        } />
        <Route path="/wbs" element={
          <>
            <Navigation currentPage="wbs" />
            <main><WBSGenerator /></main>
          </>
        } />
      </Routes>
    </div>
  );
}

export default App;
