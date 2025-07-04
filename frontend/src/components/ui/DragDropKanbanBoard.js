import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { DeleteIcon, TaskIcon, UserIcon, CalendarIcon } from '../icons';
import DeleteConfirmModal from './DeleteConfirmModal';
import ProgressBar from './ProgressBar';
import { PriorityBadge } from './Badges';

const DragDropKanbanBoard = ({ kanbanData, users, epics = [], sprints = [], onStatusChange, onDelete, onDragEnd }) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  const handleDeleteClick = (task) => {
    setTaskToDelete(task);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    if (taskToDelete && onDelete) {
      onDelete(taskToDelete.id);
    }
    setShowDeleteModal(false);
    setTaskToDelete(null);
  };

  const getEpicForTask = (taskEpicId) => epics.find((e) => e.id === taskEpicId);
  const getSprintForTask = (taskSprintId) => sprints.find((s) => s.id === taskSprintId);

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }
    const statusMap = { todo: 'todo', in_progress: 'in_progress', review: 'review', done: 'done' };
    const newStatus = statusMap[destination.droppableId];
    if (newStatus && onStatusChange) {
      onStatusChange(draggableId, newStatus);
    }
    if (onDragEnd) {
      onDragEnd(result);
    }
  };

  const columns = [
    { key: 'todo', title: 'To Do', count: kanbanData.todo.length, color: 'border-l-gray-400' },
    { key: 'in_progress', title: 'In Progress', count: kanbanData.in_progress.length, color: 'border-l-blue-400' },
    { key: 'review', title: 'Review', count: kanbanData.review.length, color: 'border-l-yellow-400' },
    { key: 'done', title: 'Done', count: kanbanData.done.length, color: 'border-l-green-400' },
  ];

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {columns.map((column) => (
            <div key={column.key} className={`kanban-column border-l-4 ${column.color}`}>
              <div className="kanban-column-header">
                {column.title} ({column.count})
              </div>
              <Droppable droppableId={column.key}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-3 min-h-32 transition-colors duration-200 ${snapshot.isDraggingOver ? 'bg-purple-50 rounded-lg' : ''}`}
                  >
                    {kanbanData[column.key].map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`kanban-task group transition-all duration-200 ${snapshot.isDragging ? 'transform rotate-2 shadow-2xl bg-white' : 'hover:shadow-md'}`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h5 className="font-semibold text-gray-900 flex-1 line-clamp-2">{task.title}</h5>
                              {onDelete && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteClick(task);
                                  }}
                                  className="text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                  title="Delete Task"
                                >
                                  <DeleteIcon className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                            <div className="flex justify-between items-center mb-3">
                              <PriorityBadge priority={task.priority} />
                              {task.assigned_to && (
                                <div className="flex items-center text-xs text-gray-600">
                                  <UserIcon className="h-3 w-3 mr-1" />
                                  <span className="truncate max-w-16">
                                    {users.find((u) => u.id === task.assigned_to)?.name || 'Unknown'}
                                  </span>
                                </div>
                              )}
                            </div>
                            {task.due_date && (
                              <div className="flex items-center text-xs text-gray-600 mb-2">
                                <CalendarIcon className="h-3 w-3 mr-1" />
                                <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                              </div>
                            )}
                            {task.progress_percent !== undefined && (
                              <div className="mb-3">
                                <div className="flex justify-between items-center text-xs text-gray-600 mb-1">
                                  <span>Progress</span>
                                  <span>{task.progress_percent}%</span>
                                </div>
                                <ProgressBar progress={task.progress_percent} />
                              </div>
                            )}
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {column.key !== 'todo' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onStatusChange(task.id, 'todo');
                                  }}
                                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-2 rounded text-xs transition-colors"
                                  title="Move to To Do"
                                >
                                  ← To Do
                                </button>
                              )}
                              {column.key === 'todo' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onStatusChange(task.id, 'in_progress');
                                  }}
                                  className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 py-1 px-2 rounded text-xs transition-colors"
                                >
                                  Start →
                                </button>
                              )}
                              {column.key === 'in_progress' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onStatusChange(task.id, 'review');
                                  }}
                                  className="flex-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 py-1 px-2 rounded text-xs transition-colors"
                                >
                                  Review →
                                </button>
                              )}
                              {column.key === 'review' && (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onStatusChange(task.id, 'in_progress');
                                    }}
                                    className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 py-1 px-2 rounded text-xs transition-colors"
                                  >
                                    ← Back
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onStatusChange(task.id, 'done');
                                    }}
                                    className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 py-1 px-2 rounded text-xs transition-colors"
                                  >
                                    Done →
                                  </button>
                                </>
                              )}
                              {column.key === 'done' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onStatusChange(task.id, 'review');
                                  }}
                                  className="flex-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 py-1 px-2 rounded text-xs transition-colors"
                                >
                                  ← Review
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {kanbanData[column.key].length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <TaskIcon className="mx-auto h-8 w-8 mb-2 opacity-50" />
                        <p className="text-sm">No tasks</p>
                        <p className="text-xs mt-1">Drag tasks here</p>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Task"
        message={taskToDelete ? `Are you sure you want to delete "${taskToDelete.title}"? This action cannot be undone.` : ''}
      />
    </>
  );
};

export default DragDropKanbanBoard;
