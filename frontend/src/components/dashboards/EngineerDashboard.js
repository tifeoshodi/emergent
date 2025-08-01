import React, { useState, useEffect } from 'react';
import pmfusionAPI from '../../lib/api';
import { Button, Card, CardHeader, CardTitle, CardContent } from '../ui';
import EnhancedTaskCard from '../ui/EnhancedTaskCard';

const EngineerDashboard = ({ user, onLogout }) => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('all');
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [taskStats, setTaskStats] = useState({});
  const [filter, setFilter] = useState('all'); // all, assigned, due_soon, overdue

  useEffect(() => {
    loadProjects();
    loadTasks();
  }, []);

  useEffect(() => {
    loadTasks();
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      const data = await pmfusionAPI.getProjects();
      setProjects(data);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const loadTasks = async () => {
    try {
      setLoading(true);
      
      let query = `project_id=${selectedProject}`;
      if (selectedProject === 'all') {
        query = '';
      }
      
      // Get tasks assigned to this user in their discipline
      const data = await pmfusionAPI.getDisciplineKanban(user.discipline, selectedProject === 'all' ? null : selectedProject);
      
      if (data && data.board) {
        // Flatten all tasks from all columns and filter by assigned user
        const allTasks = Object.values(data.board).flat().filter(task => 
          task.assigned_to === user.id
        );
        setTasks(allTasks);
        calculateStats(allTasks);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (taskList) => {
    const stats = {
      total: taskList.length,
      todo: taskList.filter(t => t.status === 'todo').length,
      in_progress: taskList.filter(t => t.status === 'in_progress').length,
      review: taskList.filter(t => t.status === 'review').length,
      done: taskList.filter(t => t.status === 'done').length,
      overdue: 0,
      due_soon: 0
    };

    const today = new Date();
    const threeDaysFromNow = new Date(today.getTime() + (3 * 24 * 60 * 60 * 1000));

    taskList.forEach(task => {
      if (task.due_date) {
        const dueDate = new Date(task.due_date);
        if (dueDate < today && task.status !== 'done') {
          stats.overdue++;
        } else if (dueDate <= threeDaysFromNow && dueDate >= today && task.status !== 'done') {
          stats.due_soon++;
        }
      }
    });

    setTaskStats(stats);
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowTaskDetail(true);
  };

  const handleTaskUpdate = async (taskId, updates) => {
    try {
      await pmfusionAPI.request(`/tasks/${taskId}`, 'PUT', updates);
      await loadTasks(); // Refresh tasks
      setShowTaskDetail(false);
      setSelectedTask(null);
    } catch (error) {
      console.error('Failed to update task:', error);
      alert('Failed to update task. Please try again.');
    }
  };

  const getFilteredTasks = () => {
    switch (filter) {
      case 'assigned':
        return tasks.filter(t => t.status !== 'done');
      case 'due_soon':
        const threeDaysFromNow = new Date(Date.now() + (3 * 24 * 60 * 60 * 1000));
        return tasks.filter(t => {
          if (!t.due_date || t.status === 'done') return false;
          const dueDate = new Date(t.due_date);
          return dueDate <= threeDaysFromNow;
        });
      case 'overdue':
        const today = new Date();
        return tasks.filter(t => {
          if (!t.due_date || t.status === 'done') return false;
          const dueDate = new Date(t.due_date);
          return dueDate < today;
        });
      default:
        return tasks;
    }
  };

  const getRoleDisplayName = (role) => {
    const roleMap = {
      'senior_engineer_1': 'Senior Engineer I',
      'senior_engineer_2': 'Senior Engineer II',
      'intermediate_engineer': 'Intermediate Engineer',
      'junior_engineer': 'Junior Engineer'
    };
    return roleMap[role] || role.replace('_', ' ').toUpperCase();
  };

  const getTasksByStatus = () => {
    return {
      todo: tasks.filter(t => t.status === 'todo'),
      in_progress: tasks.filter(t => t.status === 'in_progress'),
      review: tasks.filter(t => ['review', 'review_dic', 'review_idc', 'review_dcc'].includes(t.status)),
      done: tasks.filter(t => t.status === 'done')
    };
  };

  const tasksByStatus = getTasksByStatus();
  const filteredTasks = getFilteredTasks();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="h-8 w-8 bg-blue-600 rounded-md flex items-center justify-center">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">My Dashboard</h1>
                <p className="text-sm text-gray-500">{user.discipline} - {getRoleDisplayName(user.role)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{getRoleDisplayName(user.role)}</p>
              </div>
              <Button 
                onClick={onLogout}
                className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 text-sm"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Project Selection */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>My Tasks</CardTitle>
                <p className="text-sm text-gray-500 mt-1">Manage your assigned tasks across projects</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">My Discipline</div>
                <div className="text-lg font-semibold text-blue-600">{user.discipline}</div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label htmlFor="project-filter" className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Project
                </label>
                <select 
                  id="project-filter"
                  value={selectedProject} 
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Projects</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name} ({project.status?.replace('_', ' ').toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current View
                </label>
                <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-md">
                  <span className="text-blue-800 font-medium">
                    {selectedProject === 'all' ? 'All Projects' : projects.find(p => p.id === selectedProject)?.name || 'Unknown Project'}
                  </span>
                  <span className="text-blue-600 text-sm ml-2">• {tasks.length} tasks</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">{taskStats.total}</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Total Tasks</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">{taskStats.todo}</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">To Do</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                  <span className="text-sm font-medium text-yellow-600">{taskStats.in_progress}</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">In Progress</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                  <span className="text-sm font-medium text-purple-600">{taskStats.review}</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">In Review</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-md flex items-center justify-center">
                  <span className="text-sm font-medium text-red-600">{taskStats.overdue}</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Overdue</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                  <span className="text-sm font-medium text-green-600">{taskStats.done}</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Completed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'all', label: 'All Tasks', count: tasks.length },
                { key: 'assigned', label: 'Active Tasks', count: tasks.filter(t => t.status !== 'done').length },
                { key: 'due_soon', label: 'Due Soon', count: taskStats.due_soon },
                { key: 'overdue', label: 'Overdue', count: taskStats.overdue }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    filter === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Task Content */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading your tasks...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No tasks found</h3>
            <p className="mt-2 text-gray-500">
              {filter === 'all' 
                ? "You don't have any assigned tasks yet. Your team leader will assign tasks from the discipline dashboard."
                : `No tasks match the current filter: ${filter.replace('_', ' ')}`
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(tasksByStatus).map(([status, statusTasks]) => {
              const statusTitles = {
                todo: 'To Do',
                in_progress: 'In Progress',
                review: 'In Review',
                done: 'Completed'
              };

              const statusColors = {
                todo: 'bg-blue-100 border-blue-300',
                in_progress: 'bg-yellow-100 border-yellow-300',
                review: 'bg-purple-100 border-purple-300',
                done: 'bg-green-100 border-green-300'
              };

              const filteredStatusTasks = statusTasks.filter(task => 
                filteredTasks.includes(task)
              );

              if (filteredStatusTasks.length === 0) return null;

              return (
                <div key={status} className="flex flex-col">
                  <div className={`p-3 rounded-t-lg border-t border-l border-r ${statusColors[status]}`}>
                    <h3 className="font-medium text-gray-800">
                      {statusTitles[status]} ({filteredStatusTasks.length})
                    </h3>
                  </div>
                  <div className="bg-white border-l border-r border-b rounded-b-lg min-h-64 p-2 space-y-2">
                    {filteredStatusTasks.map(task => (
                      <EnhancedTaskCard
                        key={task.id}
                        task={task}
                        onClick={() => handleTaskClick(task)}
                        onUpdate={handleTaskUpdate}
                        currentUser={user}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default EngineerDashboard;