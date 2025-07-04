import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Components from '../components';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const API = `${BACKEND_URL}/api`;

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

export default ProjectManagement;
