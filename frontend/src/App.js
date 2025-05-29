import React, { useState, useEffect } from "react";
import "./App.css";
import { Link } from "react-router-dom";
import axios from "axios";
import Components from "./Components";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Dashboard Component
const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, tasksRes, projectsRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`),
        axios.get(`${API}/tasks`),
        axios.get(`${API}/projects`)
      ]);
      
      setStats(statsRes.data);
      setRecentTasks(tasksRes.data.slice(0, 5)); // Show 5 recent tasks
      setProjects(projectsRes.data.slice(0, 5)); // Show 5 recent projects
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  if (!stats) return <div className="flex justify-center items-center h-64">Loading...</div>;

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">EPC Project Dashboard</h1>
        <p className="text-gray-600">Manage your engineering projects and tasks efficiently</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Tasks */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Tasks</h3>
            <Link to="/tasks" className="text-purple-600 hover:text-purple-700 text-sm font-medium">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {recentTasks.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No tasks yet</p>
            ) : (
              recentTasks.map(task => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">{task.title}</p>
                    <p className="text-sm text-gray-600">{task.status.replace('_', ' ').toUpperCase()}</p>
                  </div>
                  <Components.PriorityBadge priority={task.priority} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Projects */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Projects</h3>
            <Link to="/projects" className="text-purple-600 hover:text-purple-700 text-sm font-medium">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {projects.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No projects yet</p>
            ) : (
              projects.map(project => (
                <div key={project.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">{project.name}</p>
                    <p className="text-sm text-gray-600">{project.status.replace('_', ' ').toUpperCase()}</p>
                  </div>
                  <Components.StatusBadge status={project.status} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Task Management Component
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
    is_milestone: false
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
        duration_days: '', is_milestone: false 
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
      fetchProjectData(selectedProject.id);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const renderCurrentView = () => {
    if (!selectedProject) return null;

    switch (currentView) {
      case 'kanban':
        return <Components.KanbanBoard kanbanData={kanbanData} users={users} onStatusChange={updateTaskStatus} />;
      case 'gantt':
        return <Components.GanttChart ganttData={ganttData} users={users} />;
      case 'resources':
        return <Components.ResourceManagement resources={resourceData} />;
      default:
        return <Components.KanbanBoard kanbanData={kanbanData} users={users} onStatusChange={updateTaskStatus} />;
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
              <h2 className="text-xl font-bold text-purple-600">EPC Project Manager</h2>
            </div>
            <div className="ml-10 flex items-baseline space-x-4">
              <button
                onClick={() => setCurrentPage('dashboard')}
                className={`nav-item ${currentPage === 'dashboard' ? 'nav-item-active' : 'nav-item-inactive'}`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setCurrentPage('tasks')}
                className={`nav-item ${currentPage === 'tasks' ? 'nav-item-active' : 'nav-item-inactive'}`}
              >
                Tasks
              </button>
              <button
                onClick={() => setCurrentPage('projects')}
                className={`nav-item ${currentPage === 'projects' ? 'nav-item-active' : 'nav-item-inactive'}`}
              >
                Projects
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'tasks':
        return <TaskManagement />;
      case 'projects':
        return <ProjectManagement />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="App min-h-screen bg-gray-50">
      <Navigation currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main>
        {renderPage()}
      </main>
    </div>
  );
}

export default App;