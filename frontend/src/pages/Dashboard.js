import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { Icons } from '../components';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const API = `${BACKEND_URL}/api`;

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
          <Icons.ProjectIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Projects Found</h3>
          <p className="text-gray-600 mb-4">Create your first project to view the dashboard</p>
          <Link
            href="/projects"
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
            href="/projects"
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
              <Icons.TaskIcon className="h-8 w-8 text-white/60" />
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
              <Icons.CompleteIcon className="h-8 w-8 text-white/60" />
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
              <Icons.ActiveIcon className="h-8 w-8 text-white/60" />
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
              <Icons.MilestoneIcon className="h-8 w-8 text-white/60" />
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
              href="/projects"
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
                      <Icons.MilestoneIcon className="h-4 w-4 text-yellow-600 mr-3" />
                    ) : (
                      <Icons.TaskIcon className="h-4 w-4 text-gray-600 mr-3" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{task.title}</p>
                      <p className="text-sm text-gray-600">{task.status.replace('_', ' ').toUpperCase()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <UI.PriorityBadge priority={task.priority} />
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
              href="/projects"
              className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-center"
            >
              <Icons.TaskIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="font-medium text-gray-900">Kanban Board</p>
              <p className="text-xs text-gray-600">Manage tasks</p>
            </Link>
            
            <Link
              href="/projects"
              className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-center"
            >
              <Icons.ChartIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="font-medium text-gray-900">Gantt Chart</p>
              <p className="text-xs text-gray-600">Timeline view</p>
            </Link>
            
            <Link
              href="/projects"
              className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-center"
            >
              <Icons.ResourceIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="font-medium text-gray-900">Resources</p>
              <p className="text-xs text-gray-600">Team allocation</p>
            </Link>
            
            <Link
              href="/tasks"
              className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-center"
            >
              <Icons.UserIcon className="h-8 w-8 text-orange-600 mx-auto mb-2" />
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

export default Dashboard;
