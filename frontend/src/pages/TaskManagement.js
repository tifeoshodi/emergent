import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Icons, UI } from '../components';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const API = `${BACKEND_URL}/api`;

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

      <UI.DragDropKanbanBoard
        kanbanData={kanbanData}
        users={users}
        onStatusChange={updateTaskStatus}
        onDragEnd={handleDragEnd}
        onDelete={deleteTask}
      />

      {Object.values(kanbanData).every(col => col.length === 0) && (
        <div className="text-center py-12">
          <Icons.TaskIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Tasks Yet</h3>
          <p className="text-gray-600 mb-4">Create your first independent task to get started</p>
        </div>
      )}
    </div>
  );
};

export default TaskManagement;
