import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

// SVG Icons
const ProjectIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

const TaskIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
);

const ActiveIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const CompleteIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const UserIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const CalendarIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ClockIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ChartIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const ResourceIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const DeleteIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const ConfirmIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

const EditIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const MilestoneIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
  </svg>
);

const EpicIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const SprintIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const StoryPointIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const BurndownIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4-4 4-4" />
  </svg>
);

// Delete Confirmation Modal Component
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Delete", isDanger = true }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md m-4 modal">
        <div className="flex items-center mb-4">
          <ConfirmIcon className="h-8 w-8 text-red-600 mr-3" />
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        </div>
        
        <p className="text-gray-600 mb-6">{message}</p>
        
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className={`flex-1 ${isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} text-white py-3 rounded-xl font-medium transition-colors`}
          >
            {confirmText}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-xl font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// Priority Badge Component
const PriorityBadge = ({ priority }) => {
  const getColorClass = (priority) => {
    switch (priority) {
      case 'low': return 'priority-low';
      case 'medium': return 'priority-medium';
      case 'high': return 'priority-high';
      case 'critical': return 'priority-critical';
      default: return 'priority-medium';
    }
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getColorClass(priority)}`}>
      {priority.toUpperCase()}
    </span>
  );
};

// Status Badge Component
const StatusBadge = ({ status }) => {
  const getColorClass = (status) => {
    switch (status) {
      case 'todo': return 'status-todo';
      case 'in_progress': return 'status-in_progress';
      case 'review': return 'status-review';
      case 'done': return 'status-done';
      case 'planning': return 'status-planning';
      case 'active': return 'status-active';
      case 'on_hold': return 'status-on_hold';
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-todo';
    }
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getColorClass(status)}`}>
      {status.replace('_', ' ').toUpperCase()}
    </span>
  );
};

// Story Point Badge Component
const StoryPointBadge = ({ points }) => {
  if (!points) return null;
  
  return (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
      <StoryPointIcon className="h-3 w-3 mr-1" />
      {points}
    </span>
  );
};

// Epic Badge Component
const EpicBadge = ({ epic, compact = false }) => {
  if (!epic) return null;
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 ${compact ? 'max-w-20 truncate' : ''}`}>
      <EpicIcon className="h-3 w-3 mr-1 flex-shrink-0" />
      {compact ? epic.title.substring(0, 8) + '...' : epic.title}
    </span>
  );
};

// Sprint Badge Component
const SprintBadge = ({ sprint, compact = false }) => {
  if (!sprint) return null;
  
  const getSprintColor = (status) => {
    switch (status) {
      case 'planning': return 'bg-gray-100 text-gray-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSprintColor(sprint.status)} ${compact ? 'max-w-24 truncate' : ''}`}>
      <SprintIcon className="h-3 w-3 mr-1 flex-shrink-0" />
      {compact ? sprint.name.substring(0, 10) + '...' : sprint.name}
    </span>
  );
};
const ProgressBar = ({ progress, className = "" }) => {
  const percentage = Math.min(Math.max(progress || 0, 0), 100);
  
  return (
    <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
      <div 
        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

// Task Card Component
const TaskCard = ({ task, users, onStatusChange, onDelete }) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const assignedUser = users.find(user => user.id === task.assigned_to);
  
  const handleStatusChange = (newStatus) => {
    onStatusChange(task.id, newStatus);
  };

  const handleDelete = () => {
    onDelete(task.id);
    setShowDeleteModal(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <>
      <div className="task-card">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-1">{task.title}</h4>
            <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
          </div>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="text-gray-400 hover:text-red-600 transition-colors ml-2"
            title="Delete Task"
          >
            <DeleteIcon className="h-4 w-4" />
          </button>
        </div>
        
        <div className="flex items-center justify-between mb-3">
          <PriorityBadge priority={task.priority} />
          <StatusBadge status={task.status} />
        </div>

        <div className="space-y-2 mb-4">
          {assignedUser && (
            <div className="flex items-center text-sm text-gray-600">
              <UserIcon className="h-4 w-4 mr-2" />
              <span>{assignedUser.name}</span>
            </div>
          )}
          
          {task.due_date && (
            <div className="flex items-center text-sm text-gray-600">
              <CalendarIcon className="h-4 w-4 mr-2" />
              <span>Due: {formatDate(task.due_date)}</span>
            </div>
          )}
          
          {task.estimated_hours && (
            <div className="flex items-center text-sm text-gray-600">
              <ClockIcon className="h-4 w-4 mr-2" />
              <span>{task.estimated_hours}h estimated</span>
            </div>
          )}

          {task.progress_percent !== undefined && (
            <div className="space-y-1">
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>Progress</span>
                <span>{task.progress_percent}%</span>
              </div>
              <ProgressBar progress={task.progress_percent} />
            </div>
          )}
        </div>

        {/* Status Change Buttons */}
        <div className="flex gap-1">
          {task.status !== 'todo' && (
            <button
              onClick={() => handleStatusChange('todo')}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-lg text-xs font-medium transition-colors"
            >
              To Do
            </button>
          )}
          {task.status !== 'in_progress' && (
            <button
              onClick={() => handleStatusChange('in_progress')}
              className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 px-3 rounded-lg text-xs font-medium transition-colors"
            >
              Progress
            </button>
          )}
          {task.status !== 'done' && (
            <button
              onClick={() => handleStatusChange('done')}
              className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 py-2 px-3 rounded-lg text-xs font-medium transition-colors"
            >
              Done
            </button>
          )}
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Task"
        message={`Are you sure you want to delete "${task.title}"? This action cannot be undone.`}
      />
    </>
  );
};

// Gantt Chart Component
const GanttChart = ({ ganttData, users, onProgressUpdate }) => {
  if (!ganttData || !ganttData.tasks || ganttData.tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <ChartIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Gantt Data</h3>
        <p className="text-gray-600">Tasks need start and end dates to display in Gantt chart</p>
      </div>
    );
  }

  const startDate = new Date(ganttData.project_start);
  const endDate = new Date(ganttData.project_end);
  const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) || 1;

  const getTaskPosition = (task) => {
    const taskStart = new Date(task.start_date);
    const taskEnd = new Date(task.end_date);
    const startOffset = Math.ceil((taskStart - startDate) / (1000 * 60 * 60 * 24));
    const duration = Math.ceil((taskEnd - taskStart) / (1000 * 60 * 60 * 24)) || 1;
    
    return {
      left: `${(startOffset / totalDays) * 100}%`,
      width: `${(duration / totalDays) * 100}%`
    };
  };

  const getTaskColor = (task) => {
    if (task.is_milestone) return 'bg-yellow-500';
    if (ganttData.critical_path?.includes(task.id)) return 'bg-red-500';
    switch (task.priority) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-blue-500';
      case 'low': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Project Gantt Chart</h3>
            <p className="text-sm text-gray-600">
              {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()} ({totalDays} days)
            </p>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
              <span>Critical Path</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded mr-2"></div>
              <span>Milestone</span>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Timeline Header */}
          <div className="bg-gray-50 border-b border-gray-200 p-4">
            <div className="flex">
              <div className="w-64 flex-shrink-0"></div>
              <div className="flex-1 relative h-8">
                {Array.from({ length: Math.min(totalDays, 30) }, (_, i) => {
                  const date = new Date(startDate);
                  date.setDate(date.getDate() + Math.floor((i / 30) * totalDays));
                  return (
                    <div
                      key={i}
                      className="absolute text-xs text-gray-600"
                      style={{ left: `${(i / 30) * 100}%` }}
                    >
                      {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Tasks */}
          <div className="divide-y divide-gray-200">
            {ganttData.tasks.map((task, index) => {
              const assignedUser = users.find(user => user.id === task.assigned_to);
              const position = getTaskPosition(task);
              
              return (
                <div key={task.id} className="flex items-center p-4 hover:bg-gray-50">
                  {/* Task Info */}
                  <div className="w-64 flex-shrink-0 pr-4">
                    <div className="flex items-center">
                      <TaskIcon className="h-4 w-4 text-gray-600 mr-2" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                        {assignedUser && (
                          <p className="text-xs text-gray-600">{assignedUser.name}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Gantt Bar */}
                  <div className="flex-1 relative h-8">
                    <div
                      className={`absolute h-6 rounded ${getTaskColor(task)} flex items-center px-2`}
                      style={position}
                    >
                      <div className="text-white text-xs font-medium truncate">
                        {task.progress_percent}%
                      </div>
                      {/* Progress overlay */}
                      <div 
                        className="absolute top-0 left-0 h-full bg-green-400 opacity-50 rounded"
                        style={{ width: `${task.progress_percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="w-20 text-right text-sm text-gray-600">
                    {task.duration_days}d
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// Resource Management Component
const ResourceManagement = ({ resources, onResourceClick }) => {
  if (!resources || !resources.resources) {
    return (
      <div className="text-center py-12">
        <ResourceIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Resource Data</h3>
        <p className="text-gray-600">Resource allocation will appear here when tasks are assigned</p>
      </div>
    );
  }

  const getUtilizationColor = (utilization) => {
    if (utilization > 100) return 'text-red-600 bg-red-100';
    if (utilization > 80) return 'text-orange-600 bg-orange-100';
    if (utilization > 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Resource Allocation</h3>
            <p className="text-sm text-gray-600">
              {resources.total_hours_allocated}h allocated of {resources.total_hours_required}h required
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-purple-600">
              {Math.round((resources.total_hours_allocated / resources.total_hours_required) * 100) || 0}%
            </p>
            <p className="text-sm text-gray-600">Allocated</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-4">
          {resources.resources.map(resource => (
            <div
              key={resource.user_id}
              className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onResourceClick && onResourceClick(resource)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <UserIcon className="h-8 w-8 text-gray-600 mr-3" />
                  <div>
                    <h4 className="font-semibold text-gray-900">{resource.user_name}</h4>
                    <p className="text-sm text-gray-600">{resource.discipline}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getUtilizationColor(resource.utilization_percent)}`}>
                    {Math.round(resource.utilization_percent)}%
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Allocated Hours</span>
                  <span className="font-medium">{resource.total_allocated_hours}h</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Available Hours</span>
                  <span className="font-medium">{resource.available_hours}h</span>
                </div>
                <ProgressBar 
                  progress={resource.utilization_percent} 
                  className="mt-2"
                />
              </div>

              <div className="mt-3">
                <p className="text-sm text-gray-600 mb-2">Active Tasks: {resource.tasks.length}</p>
                <div className="flex flex-wrap gap-1">
                  {resource.tasks.slice(0, 3).map(task => (
                    <span key={task.id} className="px-2 py-1 bg-gray-100 text-xs rounded">
                      {task.title}
                    </span>
                  ))}
                  {resource.tasks.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-xs rounded">
                      +{resource.tasks.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Kanban Board Component
const KanbanBoard = ({ kanbanData, users, onStatusChange, onDelete }) => {
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

  const columns = [
    { key: 'todo', title: 'To Do', count: kanbanData.todo.length },
    { key: 'in_progress', title: 'In Progress', count: kanbanData.in_progress.length },
    { key: 'review', title: 'Review', count: kanbanData.review.length },
    { key: 'done', title: 'Done', count: kanbanData.done.length }
  ];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map(column => (
          <div key={column.key} className="kanban-column">
            <div className="kanban-column-header">
              {column.title} ({column.count})
            </div>
            <div className="space-y-3">
              {kanbanData[column.key].map(task => (
                <div key={task.id} className="kanban-task group">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-semibold text-gray-900 flex-1">{task.title}</h5>
                    {onDelete && (
                      <button
                        onClick={() => handleDeleteClick(task)}
                        className="text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete Task"
                      >
                        <DeleteIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <PriorityBadge priority={task.priority} />
                    {task.assigned_to && (
                      <div className="flex items-center text-xs text-gray-600">
                        <UserIcon className="h-3 w-3 mr-1" />
                        <span>{users.find(u => u.id === task.assigned_to)?.name || 'Unknown'}</span>
                      </div>
                    )}
                  </div>

                  {task.due_date && (
                    <div className="flex items-center text-xs text-gray-600 mb-3">
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

                  {/* Status change buttons */}
                  <div className="flex gap-1">
                    {column.key !== 'todo' && (
                      <button
                        onClick={() => onStatusChange(task.id, 'todo')}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-2 rounded text-xs transition-colors"
                      >
                        ← To Do
                      </button>
                    )}
                    {column.key === 'todo' && (
                      <button
                        onClick={() => onStatusChange(task.id, 'in_progress')}
                        className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 py-1 px-2 rounded text-xs transition-colors"
                      >
                        Start →
                      </button>
                    )}
                    {column.key === 'in_progress' && (
                      <>
                        <button
                          onClick={() => onStatusChange(task.id, 'review')}
                          className="flex-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 py-1 px-2 rounded text-xs transition-colors"
                        >
                          Review →
                        </button>
                      </>
                    )}
                    {column.key === 'review' && (
                      <>
                        <button
                          onClick={() => onStatusChange(task.id, 'in_progress')}
                          className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 py-1 px-2 rounded text-xs transition-colors"
                        >
                          ← Back
                        </button>
                        <button
                          onClick={() => onStatusChange(task.id, 'done')}
                          className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 py-1 px-2 rounded text-xs transition-colors"
                        >
                          Done →
                        </button>
                      </>
                    )}
                    {column.key === 'done' && (
                      <button
                        onClick={() => onStatusChange(task.id, 'review')}
                        className="flex-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 py-1 px-2 rounded text-xs transition-colors"
                      >
                        ← Review
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              {kanbanData[column.key].length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <TaskIcon className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No tasks</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

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

// Export all components
const Components = {
  ProjectIcon,
  TaskIcon,
  ActiveIcon,
  CompleteIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  ChartIcon,
  ResourceIcon,
  DeleteIcon,
  ConfirmIcon,
  EditIcon,
  MilestoneIcon,
  PriorityBadge,
  StatusBadge,
  ProgressBar,
  TaskCard,
  GanttChart,
  ResourceManagement,
  KanbanBoard,
  DeleteConfirmModal
};

export default Components;