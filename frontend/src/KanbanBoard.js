import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import pmfusionAPI from './lib/api';
import { supabase } from './lib/supabaseClient';

const KanbanBoard = ({ disciplineId, projectId, currentUser }) => {
  const [kanbanData, setKanbanData] = useState({
    backlog: [],
    todo: [],
    in_progress: [],
    review_dic: [],
    review_idc: [],
    review_dcc: [],
    done: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);

  // Define kanban columns
  const columns = [
    { id: 'backlog', title: 'Backlog', color: 'bg-gray-100' },
    { id: 'todo', title: 'To Do', color: 'bg-blue-100' },
    { id: 'in_progress', title: 'In Progress', color: 'bg-yellow-100' },
    { id: 'review_dic', title: 'DIC Review', color: 'bg-purple-100' },
    { id: 'review_idc', title: 'IDC Review', color: 'bg-orange-100' },
    { id: 'review_dcc', title: 'DCC Review', color: 'bg-pink-100' },
    { id: 'done', title: 'Done', color: 'bg-green-100' }
  ];

  useEffect(() => {
    // Only load kanban data if both disciplineId and projectId are provided
    if (disciplineId && projectId) {
      loadKanbanData();
    } else {
      setLoading(false);
      setError('Missing discipline ID or project ID');
      // Load mock data when IDs are missing
      loadMockData();
    }
  }, [disciplineId, projectId]);

  useEffect(() => {
    if (!disciplineId || !projectId || !supabase || supabase.isMockClient) {
      return;
    }

    const channel = supabase.channel(`tasks-${projectId}-${disciplineId}`);

    const handleChange = (payload) => {
      const task = payload.new;
      if (!task || task.discipline_id !== disciplineId) return;

      setKanbanData((prev) => {
        const updated = { ...prev };
        // Remove task from all columns
        Object.keys(updated).forEach((col) => {
          updated[col] = updated[col].filter((t) => t.id !== task.id);
        });

        const status = task.status || 'backlog';
        if (!updated[status]) updated[status] = [];
        updated[status] = [task, ...updated[status]];
        return updated;
      });
    };

    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tasks',
          filter: `project_id=eq.${projectId},discipline_id=eq.${disciplineId}`,
        },
        handleChange
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tasks',
          filter: `project_id=eq.${projectId},discipline_id=eq.${disciplineId}`,
        },
        handleChange
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [disciplineId, projectId]);

  const loadKanbanData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await pmfusionAPI.getDisciplineKanban(disciplineId, projectId);
      const defaultKanbanStructure = {
        backlog: [],
        todo: [],
        in_progress: [],
        review_dic: [],
        review_idc: [],
        review_dcc: [],
        done: []
      };
      setKanbanData(response.kanban || defaultKanbanStructure);
    } catch (error) {
      console.error('Failed to load kanban data:', error);
      setError('Failed to load kanban data. Using demo data instead.');
      // Use mock data on error
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = () => {
    // Mock data for demo or when API fails
    setKanbanData({
      backlog: [
        { id: '1', title: 'P&ID Development', description: 'Create detailed P&ID diagrams', priority: 2, assignee_name: 'Unassigned' },
        { id: '2', title: 'Process Simulation', description: 'Run Aspen Plus simulations', priority: 1, assignee_name: 'Unassigned' }
      ],
      todo: [],
      in_progress: [
        { id: '3', title: 'Process Flow Diagrams', description: 'Create PFDs for the revamp', priority: 3, assignee_name: 'David Wilson' }
      ],
      review_dic: [],
      review_idc: [],
      review_dcc: [],
      done: []
    });
  };

  // Handle refresh button click - check for necessary IDs first
  const handleRefresh = () => {
    if (disciplineId && projectId) {
      loadKanbanData();
    } else {
      console.warn('Cannot refresh: missing disciplineId or projectId');
      setError('Cannot refresh: missing discipline ID or project ID');
      loadMockData();
    }
  };

  // Handle add task button click
  const handleAddTask = () => {
    if (!disciplineId || !projectId) {
      alert('Cannot add task: missing discipline ID or project ID');
      return;
    }
    setShowAddTaskModal(true);
  };

  // Mock function to create a new task (in production this would call the API)
  const createNewTask = (taskData) => {
    const newTask = {
      id: Date.now().toString(), // Simple ID generation for demo
      title: taskData.title || 'New Task',
      description: taskData.description || '',
      priority: taskData.priority || 2,
      assignee_name: taskData.assignee_name || 'Unassigned',
      status: 'backlog',
      created_at: new Date().toISOString()
    };

    // Add to backlog
    setKanbanData(prev => ({
      ...prev,
      backlog: [...prev.backlog, newTask]
    }));

    setShowAddTaskModal(false);
  };

  // Handle drag and drop operations
  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    // If dropped outside a droppable area, do nothing
    if (!destination) {
      return;
    }

    // If dropped in the same position, do nothing
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceColumnId = source.droppableId;
    const destinationColumnId = destination.droppableId;

    // Find the task being moved
    const sourceColumn = kanbanData[sourceColumnId];
    const taskToMove = sourceColumn.find(task => task.id === draggableId);

    if (!taskToMove) {
      console.error('Task not found:', draggableId);
      return;
    }

    // Create new kanban data with the task moved
    setKanbanData(prev => {
      const newKanbanData = { ...prev };

      // Remove task from source column
      newKanbanData[sourceColumnId] = prev[sourceColumnId].filter(
        task => task.id !== draggableId
      );

      // Update task status to match the destination column
      const updatedTask = {
        ...taskToMove,
        status: destinationColumnId
      };

      // Add task to destination column at the specified index
      const destinationColumn = [...prev[destinationColumnId]];
      destinationColumn.splice(destination.index, 0, updatedTask);
      newKanbanData[destinationColumnId] = destinationColumn;

      return newKanbanData;
    });

    // Update task status on the server to keep UI and server data in sync
    const updateTaskOnServer = async () => {
      try {
        await pmfusionAPI.updateTaskStatus(draggableId, destinationColumnId);
        console.log(`Task ${draggableId} status updated to ${destinationColumnId} on server`);
      } catch (error) {
        console.error('Failed to update task status on server:', error);
        // Optionally, you could revert the local state change here
        // or show a user notification about the sync failure
      }
    };

    // Call the server update asynchronously
    updateTaskOnServer();
  };

  // Simple Add Task Modal Component
  const AddTaskModal = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState(2);

    const handleSubmit = (e) => {
      e.preventDefault();
      if (!title.trim()) {
        alert('Task title is required');
        return;
      }
      
      createNewTask({
        title: title.trim(),
        description: description.trim(),
        priority: parseInt(priority, 10)
      });      
      // Reset form
      setTitle('');
      setDescription('');
      setPriority(2);
    };

    if (!showAddTaskModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
          <h3 className="text-lg font-semibold mb-4">Add New Task</h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Task Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter task title"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter task description"
                rows="3"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>High (P1)</option>
                <option value={2}>Medium (P2)</option>
                <option value={3}>Low (P3)</option>
              </select>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddTaskModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Add Task
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const TaskCard = ({ task, index }) => {
    const getPriorityColor = (priority) => {
      switch (priority) {
        case 1: return 'border-red-500 bg-red-50';
        case 2: return 'border-orange-500 bg-orange-50';
        case 3: return 'border-blue-500 bg-blue-50';
        default: return 'border-gray-300 bg-white';
      }
    };

    return (
      <Draggable draggableId={task.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`p-3 mb-3 rounded-lg border-l-4 cursor-pointer hover:shadow-md transition-shadow ${
              getPriorityColor(task.priority)
            } ${
              snapshot.isDragging ? 'rotate-3 shadow-lg' : ''
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className="text-sm font-semibold text-gray-900">
                {task.title}
              </h4>
              <span className={`text-xs px-2 py-1 rounded-full ${
                task.priority === 1 ? 'bg-red-100 text-red-800' :
                task.priority === 2 ? 'bg-orange-100 text-orange-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                P{task.priority}
              </span>
            </div>
            
            {task.description && (
              <p className="text-xs text-gray-600 mb-2">
                {task.description}
              </p>
            )}
            
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>{task.assignee_name || 'Unassigned'}</span>
              {task.due_date && <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>}
            </div>
          </div>
        )}
      </Draggable>
    );
  };

  const KanbanColumn = ({ column }) => {
    const tasks = kanbanData[column.id] || [];
    
    return (
      <div className={`flex-1 min-w-[18rem] p-4 rounded-lg ${column.color}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-900">{column.title}</h3>
          <span className="bg-white text-gray-700 px-2 py-1 rounded-full text-sm font-medium">
            {tasks.length}
          </span>
        </div>
        
        <Droppable droppableId={column.id}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`space-y-2 min-h-[16rem] p-2 rounded-md transition-colors ${
                snapshot.isDraggingOver ? 'bg-blue-50 border-2 border-dashed border-blue-300' : ''
              }`}
            >
              {tasks.map((task, index) => (
                <TaskCard key={task.id} task={task} index={index} />
              ))}
              
              {provided.placeholder}
              
              {tasks.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-sm">No tasks</div>
                </div>
              )}
            </div>
          )}
        </Droppable>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading kanban board...</span>
      </div>
    );
  }

  // Show error message if there's an error
  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg mb-4">
          <h3 className="font-medium text-lg">Error Loading Kanban Board</h3>
          <p className="text-sm">{error}</p>
        </div>
        <button 
          onClick={() => disciplineId && projectId ? loadKanbanData() : loadMockData()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Team Workspace</h2>
          <p className="text-gray-600">Discipline-based task management</p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            title={disciplineId && projectId ? 'Refresh kanban data' : 'Cannot refresh: missing IDs'}
          >
            Refresh
          </button>
          <button 
            onClick={handleAddTask}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            title={disciplineId && projectId ? 'Add new task' : 'Cannot add task: missing IDs'}
          >
            Add Task
          </button>
        </div>
      </div>

      {/* Add Task Modal */}
      <AddTaskModal />

      {/* Workflow Status Legend */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Three-Phase Workflow Status</h4>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-2 py-1 bg-gray-200 rounded">Backlog → To Do → In Progress</span>
          <span className="px-2 py-1 bg-purple-200 rounded">DIC (Discipline Internal Check)</span>
          <span className="px-2 py-1 bg-orange-200 rounded">IDC (Inter-Discipline Check)</span>
          <span className="px-2 py-1 bg-pink-200 rounded">DCC (Document Control Centre)</span>
          <span className="px-2 py-1 bg-green-200 rounded">Done</span>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 min-w-max pb-4">
            {columns.map(column => (
              <KanbanColumn key={column.id} column={column} />
            ))}
          </div>
        </DragDropContext>
      </div>

      {/* Instructions */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Demo Mode:</strong> This kanban board shows the three-phase workflow structure. 
          Tasks flow through Backlog → Teams → Document Control phases.
        </p>
      </div>
    </div>
  );
};

export default KanbanBoard; 