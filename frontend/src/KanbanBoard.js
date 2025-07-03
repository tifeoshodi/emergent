import React, { useState, useEffect } from 'react';
import pmfusionAPI from './lib/api';

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

  const loadKanbanData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await pmfusionAPI.getDisciplineKanban(disciplineId, projectId);
      setKanbanData(response.kanban || kanbanData);
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

  const TaskCard = ({ task }) => {
    const getPriorityColor = (priority) => {
      switch (priority) {
        case 1: return 'border-red-500 bg-red-50';
        case 2: return 'border-orange-500 bg-orange-50';
        case 3: return 'border-blue-500 bg-blue-50';
        default: return 'border-gray-300 bg-white';
      }
    };

    return (
      <div className={`p-3 mb-3 rounded-lg border-l-4 cursor-pointer hover:shadow-md transition-shadow ${getPriorityColor(task.priority)}`}>
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
    );
  };

  const KanbanColumn = ({ column }) => {
    const tasks = kanbanData[column.id] || [];
    
    return (
      <div className={`flex-1 min-w-72 p-4 rounded-lg ${column.color}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-900">{column.title}</h3>
          <span className="bg-white text-gray-700 px-2 py-1 rounded-full text-sm font-medium">
            {tasks.length}
          </span>
        </div>
        
        <div className="space-y-2 min-h-64">
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
          
          {tasks.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-sm">No tasks</div>
            </div>
          )}
        </div>
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
          onClick={disciplineId && projectId ? loadKanbanData : loadMockData}
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
            onClick={loadKanbanData}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            Refresh
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            Add Task
          </button>
        </div>
      </div>

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
        <div className="flex gap-4 min-w-max pb-4">
          {columns.map(column => (
            <KanbanColumn key={column.id} column={column} />
          ))}
        </div>
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