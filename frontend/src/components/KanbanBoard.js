import React, { useState, useEffect } from 'react';
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from './ui';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import pmfusionAPI from '../lib/api';

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
  const [announce, setAnnounce] = useState('');
  const [disciplineUsers, setDisciplineUsers] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // Define kanban columns
  const columns = [
    { id: 'backlog', title: 'Backlog', color: 'bg-discipline1/20' },
    { id: 'todo', title: 'To Do', color: 'bg-discipline2/20' },
    { id: 'in_progress', title: 'In Progress', color: 'bg-discipline3/20' },
    { id: 'review_dic', title: 'DIC Review', color: 'bg-discipline4/20' },
    { id: 'review_idc', title: 'IDC Review', color: 'bg-discipline5/20' },
    { id: 'review_dcc', title: 'DCC Review', color: 'bg-discipline2/20' },
    { id: 'done', title: 'Done', color: 'bg-discipline3/20' }
  ];

  useEffect(() => {
    // Load kanban data if disciplineId is provided (projectId is optional)
    if (disciplineId) {
      loadKanbanData();
      loadDisciplineUsers();
    } else {
      setLoading(false);
      setError('Missing discipline ID');
      // Load mock data when discipline ID is missing
      loadMockData();
    }
  }, [disciplineId, projectId]);

  const loadDisciplineUsers = async () => {
    try {
      const users = await pmfusionAPI.getDisciplineUsers(disciplineId);
      setDisciplineUsers(users);
    } catch (error) {
      console.error('Failed to load discipline users:', error);
    }
  };


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
      setKanbanData(response.board || defaultKanbanStructure);
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
    if (disciplineId) {
      loadKanbanData();
    } else {
      console.warn('Cannot refresh: missing disciplineId');
      setError('Cannot refresh: missing discipline ID');
      loadMockData();
    }
  };

  // Handle add task button click
  const handleAddTask = () => {
    if (!disciplineId) {
      alert('Cannot add task: missing discipline ID');
      return;
    }
    // Note: projectId is optional for discipline-wide kanban
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

  // Handle task assignment
  const handleAssignTask = (task) => {
    setSelectedTask(task);
    setShowAssignModal(true);
  };

  const assignTask = async (userId) => {
    if (!selectedTask) return;
    
    try {
      await pmfusionAPI.assignTask(selectedTask.id, userId);
      
      // Find the assigned user name
      const assignedUser = disciplineUsers.find(u => u.id === userId);
      const assignedUserName = assignedUser ? assignedUser.name : 'Unknown User';
      
      // Update local state - move from backlog to todo if unassigned
      setKanbanData(prev => {
        const updated = { ...prev };
        
        // Find task in all columns
        let taskFound = false;
        let sourceColumn = null;
        
        for (const columnId of Object.keys(updated)) {
          const taskIndex = updated[columnId].findIndex(t => t.id === selectedTask.id);
          if (taskIndex !== -1) {
            sourceColumn = columnId;
            updated[columnId][taskIndex] = {
              ...updated[columnId][taskIndex],
              assigned_to: userId,
              assignee_name: assignedUserName
            };
            
            // Move from backlog to todo when assigned
            if (columnId === 'backlog') {
              const task = updated[columnId][taskIndex];
              updated[columnId].splice(taskIndex, 1);
              updated.todo.push(task);
            }
            
            taskFound = true;
            break;
          }
        }
        
        return taskFound ? updated : prev;
      });
      
      setShowAssignModal(false);
      setSelectedTask(null);
      setAnnounce(`Task assigned to ${assignedUserName}`);
    } catch (error) {
      console.error('Failed to assign task:', error);
      alert('Failed to assign task. Please try again.');
    }
  };

  // Map frontend column names to backend status values
  const mapColumnToStatus = (columnId) => {
    const mapping = {
      'backlog': 'todo',
      'todo': 'todo',
      'in_progress': 'in_progress',
      'review_dic': 'review',
      'review_idc': 'review',
      'review_dcc': 'review',
      'done': 'done'
    };
    return mapping[columnId] || columnId;
  };

  const moveTaskKeyboard = (taskId, currentColumnId, destinationColumnId) => {
    setKanbanData(prev => {
      const updated = { ...prev };
      const task = updated[currentColumnId].find(t => t.id === taskId);
      if (!task) return prev;
      updated[currentColumnId] = updated[currentColumnId].filter(t => t.id !== taskId);
      task.status = destinationColumnId;
      updated[destinationColumnId] = [task, ...updated[destinationColumnId]];
      return updated;
    });
    
    // Convert frontend column to backend status
    const backendStatus = mapColumnToStatus(destinationColumnId);
    pmfusionAPI.updateTaskStatus(taskId, backendStatus).catch(() => {});
    setAnnounce(`Task moved to ${destinationColumnId}`);
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
        // Convert frontend column to backend status
        const backendStatus = mapColumnToStatus(destinationColumnId);
        await pmfusionAPI.updateTaskStatus(draggableId, backendStatus);
        console.log(`Task ${draggableId} status updated to ${backendStatus} (${destinationColumnId}) on server`);
        setAnnounce(`Task moved to ${destinationColumnId}`);
      } catch (error) {
        console.error('Failed to update task status on server:', error);
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
        <Card className="w-96 max-w-[90vw]">
          <CardHeader>
            <CardTitle>Add New Task</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="task-title">Task Title *</Label>
                <Input
                  id="task-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter task title"
                  required
                />
              </div>
              <div>
                <Label htmlFor="task-desc">Description</Label>
                <textarea
                  id="task-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  rows="3"
                />
              </div>
              <div>
                <Label htmlFor="task-priority">Priority</Label>
                <select
                  id="task-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value={1}>High (P1)</option>
                  <option value={2}>Medium (P2)</option>
                  <option value={3}>Low (P3)</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => setShowAddTaskModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Task</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  };

  const TaskCard = ({ task, index, columnId }) => {
    const [attachmentCount, setAttachmentCount] = useState(0);
    const [loadingAttachments, setLoadingAttachments] = useState(false);

    useEffect(() => {
      loadAttachmentCount();
    }, [task.id]);

    const loadAttachmentCount = async () => {
      try {
        setLoadingAttachments(true);
        // Use the API client for consistency
        const documents = await pmfusionAPI.request(`/documents?task_id=${task.id}`);
        setAttachmentCount(documents.length);
      } catch (error) {
        console.error('Failed to load attachment count:', error);
        setAttachmentCount(0);
      } finally {
        setLoadingAttachments(false);
      }
    };

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
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                const idx = columns.findIndex(c => c.id === columnId);
                if (e.key === 'ArrowRight' && idx < columns.length - 1) {
                  moveTaskKeyboard(task.id, columnId, columns[idx + 1].id);
                }
                if (e.key === 'ArrowLeft' && idx > 0) {
                  moveTaskKeyboard(task.id, columnId, columns[idx - 1].id);
                }
              }
            }}
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
              <div className="flex items-center gap-2">
                {/* Attachment Count */}
                {attachmentCount > 0 && (
                  <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-full" title={`${attachmentCount} attachment${attachmentCount > 1 ? 's' : ''}`}>
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    <span className="font-medium">{attachmentCount}</span>
                  </div>
                )}
                {!task.assigned_to && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAssignTask(task);
                    }}
                    className="text-blue-600 hover:text-blue-800 text-xs underline"
                    title="Assign task"
                  >
                    Assign
                  </button>
                )}
                {task.due_date && <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>}
              </div>
            </div>
          </div>
        )}
      </Draggable>
    );
  };

  const KanbanColumn = ({ column }) => {
    const tasks = kanbanData[column.id] || [];
    
    return (
      <Card className={`flex-1 min-w-[18rem] p-4 ${column.color}`}>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <h3 className="font-semibold text-gray-900">{column.title}</h3>
          <span className="bg-white text-gray-700 px-2 py-1 rounded-full text-sm font-medium">
            {tasks.length}
          </span>
        </CardHeader>
        
        <CardContent className="p-2">
          <Droppable droppableId={column.id}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`space-y-2 min-h-[16rem] rounded-md transition-colors ${
                  snapshot.isDraggingOver ? 'bg-blue-50 border-2 border-dashed border-blue-300' : ''
                }`}
              >
                {tasks.map((task, index) => (
                  <TaskCard key={task.id} task={task} index={index} columnId={column.id} />
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
        </CardContent>
      </Card>
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
          <Button
            variant="outline"
            onClick={handleRefresh}
            title={disciplineId && projectId ? 'Refresh kanban data' : 'Cannot refresh: missing IDs'}
          >
            Refresh
          </Button>
          <Button
            onClick={handleAddTask}
            title={disciplineId && projectId ? 'Add new task' : 'Cannot add task: missing IDs'}
          >
            Add Task
          </Button>
        </div>
      </div>

      {/* Add Task Modal */}
      <AddTaskModal />

      {/* Assignment Modal */}
      {showAssignModal && selectedTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <h3 className="text-lg font-semibold">Assign Task</h3>
              <p className="text-sm text-gray-600">{selectedTask.title}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Assign to:
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {disciplineUsers.map(user => (
                    <button
                      key={user.id}
                      onClick={() => assignTask(user.id)}
                      className="w-full text-left p-3 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                    >
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.role} • {user.email}</div>
                    </button>
                  ))}
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowAssignModal(false);
                      setSelectedTask(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
      <div aria-live="polite" className="sr-only">{announce}</div>
    </div>
  );
};

export default KanbanBoard; 