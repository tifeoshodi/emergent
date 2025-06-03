import React, { useState, useEffect } from 'react';
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

const DocumentIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const UploadIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const DownloadIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
  </svg>
);

const SearchIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const FilterIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
  </svg>
);

const ApprovalIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
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

// Document Management Component
const DocumentManagement = ({ projectId = null, showProjectFilter = true }) => {
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    discipline: '',
    search: ''
  });
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    category: '',
    discipline: '',
    document_number: '',
    is_confidential: false,
    tags: '',
    project_id: projectId
  });
  const [selectedFile, setSelectedFile] = useState(null);

  // EPC Document Categories
  const documentCategories = [
    { value: 'engineering_drawing', label: 'Engineering Drawing' },
    { value: 'piping_drawing', label: 'P&ID Drawing' },
    { value: 'electrical_drawing', label: 'Electrical Drawing' },
    { value: 'instrument_drawing', label: 'Instrument Drawing' },
    { value: 'technical_specification', label: 'Technical Specification' },
    { value: 'project_report', label: 'Project Report' },
    { value: 'safety_document', label: 'Safety Document' },
    { value: 'compliance_document', label: 'Compliance Document' },
    { value: 'meeting_minutes', label: 'Meeting Minutes' },
    { value: 'vendor_document', label: 'Vendor Document' },
    { value: 'as_built_document', label: 'As-Built Document' },
    { value: 'procedure', label: 'Procedure' },
    { value: 'manual', label: 'Manual' },
    { value: 'certificate', label: 'Certificate' },
    { value: 'other', label: 'Other' }
  ];

  const documentStatuses = [
    { value: 'draft', label: 'Draft' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'superseded', label: 'Superseded' },
    { value: 'archived', label: 'Archived' }
  ];

  const disciplines = [
    'Mechanical Engineering',
    'Electrical Engineering',
    'Process Engineering',
    'Civil Engineering',
    'Instrumentation & Control',
    'Piping Engineering',
    'Safety Engineering',
    'Environmental Engineering'
  ];

  useEffect(() => {
    fetchDocuments();
  }, [projectId]);

  useEffect(() => {
    applyFilters();
  }, [documents, filters]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (projectId) params.append('project_id', projectId);
      
      const response = await fetch(`${BACKEND_URL}/api/documents?${params}`);
      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...documents];

    if (filters.category) {
      filtered = filtered.filter(doc => doc.category === filters.category);
    }
    if (filters.status) {
      filtered = filtered.filter(doc => doc.status === filters.status);
    }
    if (filters.discipline) {
      filtered = filtered.filter(doc => doc.discipline === filters.discipline);
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(searchLower) ||
        doc.description.toLowerCase().includes(searchLower) ||
        doc.document_number?.toLowerCase().includes(searchLower) ||
        doc.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    setFilteredDocuments(filtered);
  };

  const handleFileSelect = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please select a file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', uploadData.title);
    formData.append('description', uploadData.description);
    formData.append('category', uploadData.category);
    if (uploadData.project_id) formData.append('project_id', uploadData.project_id);
    if (uploadData.discipline) formData.append('discipline', uploadData.discipline);
    if (uploadData.document_number) formData.append('document_number', uploadData.document_number);
    formData.append('is_confidential', uploadData.is_confidential);
    formData.append('tags', uploadData.tags);

    try {
      const response = await fetch(`${BACKEND_URL}/api/documents/upload`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        setShowUploadModal(false);
        setUploadData({
          title: '', description: '', category: '', discipline: '', 
          document_number: '', is_confidential: false, tags: '', project_id: projectId
        });
        setSelectedFile(null);
        fetchDocuments();
      } else {
        const error = await response.json();
        alert(`Upload failed: ${error.detail}`);
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Upload failed. Please try again.');
    }
  };

  const handleDownload = async (documentId, fileName) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/documents/${documentId}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Download failed. Please try again.');
    }
  };

  const handleStatusUpdate = async (documentId, newStatus) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/documents/${documentId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchDocuments();
      }
    } catch (error) {
      console.error('Error updating document status:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'superseded': return 'bg-orange-100 text-orange-800';
      case 'archived': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'engineering_drawing': return 'bg-purple-100 text-purple-800';
      case 'safety_document': return 'bg-red-100 text-red-800';
      case 'compliance_document': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Document Management</h1>
          <p className="text-gray-600">Manage engineering documents, drawings, and compliance files</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
        >
          <UploadIcon className="h-5 w-5 inline mr-2" />
          Upload Document
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <select
            value={filters.category}
            onChange={(e) => setFilters({...filters, category: e.target.value})}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {documentCategories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            {documentStatuses.map(status => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>

          <select
            value={filters.discipline}
            onChange={(e) => setFilters({...filters, discipline: e.target.value})}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">All Disciplines</option>
            {disciplines.map(discipline => (
              <option key={discipline} value={discipline}>{discipline}</option>
            ))}
          </select>

          <button
            onClick={() => setFilters({ category: '', status: '', discipline: '', search: '' })}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading documents...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map(document => (
            <div key={document.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <DocumentIcon className="h-8 w-8 text-purple-600 flex-shrink-0" />
                <div className="flex gap-2">
                  {document.is_confidential && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                      Confidential
                    </span>
                  )}
                </div>
              </div>

              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{document.title}</h3>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{document.description}</p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(document.category)}`}>
                    {documentCategories.find(c => c.value === document.category)?.label || document.category}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(document.status)}`}>
                    {documentStatuses.find(s => s.value === document.status)?.label || document.status}
                  </span>
                </div>

                {document.discipline && (
                  <div className="text-sm text-gray-600">
                    <strong>Discipline:</strong> {document.discipline}
                  </div>
                )}

                {document.document_number && (
                  <div className="text-sm text-gray-600">
                    <strong>Doc #:</strong> {document.document_number}
                  </div>
                )}

                <div className="text-sm text-gray-600">
                  <strong>Size:</strong> {formatFileSize(document.file_size)} • <strong>Version:</strong> {document.version}
                </div>

                {document.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {document.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-xs rounded">
                        {tag}
                      </span>
                    ))}
                    {document.tags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-xs rounded">
                        +{document.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleDownload(document.id, document.file_name)}
                  className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                >
                  <DownloadIcon className="h-4 w-4 inline mr-1" />
                  Download
                </button>

                {document.status !== 'approved' && (
                  <button
                    onClick={() => handleStatusUpdate(document.id, 'approved')}
                    className="bg-green-100 hover:bg-green-200 text-green-700 py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                  >
                    <ApprovalIcon className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="mt-3 text-xs text-gray-500">
                Created: {new Date(document.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredDocuments.length === 0 && !loading && (
        <div className="text-center py-12">
          <DocumentIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Documents Found</h3>
          <p className="text-gray-600 mb-4">
            {documents.length === 0 ? "Upload your first document to get started" : "Try adjusting your filters"}
          </p>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Upload Document</h3>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Document Title"
                  value={uploadData.title}
                  onChange={(e) => setUploadData({...uploadData, title: e.target.value})}
                  className="col-span-2 w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />

                <textarea
                  placeholder="Description"
                  value={uploadData.description}
                  onChange={(e) => setUploadData({...uploadData, description: e.target.value})}
                  className="col-span-2 w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent h-24"
                  required
                />

                <select
                  value={uploadData.category}
                  onChange={(e) => setUploadData({...uploadData, category: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Category</option>
                  {documentCategories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>

                <select
                  value={uploadData.discipline}
                  onChange={(e) => setUploadData({...uploadData, discipline: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select Discipline (Optional)</option>
                  {disciplines.map(discipline => (
                    <option key={discipline} value={discipline}>{discipline}</option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Document Number (Optional)"
                  value={uploadData.document_number}
                  onChange={(e) => setUploadData({...uploadData, document_number: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />

                <input
                  type="text"
                  placeholder="Tags (comma-separated)"
                  value={uploadData.tags}
                  onChange={(e) => setUploadData({...uploadData, tags: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />

                <div className="col-span-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={uploadData.is_confidential}
                      onChange={(e) => setUploadData({...uploadData, is_confidential: e.target.checked})}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Mark as Confidential</span>
                  </label>
                </div>

                <div className="col-span-2">
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                  {selectedFile && (
                    <p className="text-sm text-gray-600 mt-2">
                      Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-medium transition-colors"
                >
                  Upload Document
                </button>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Document Management Component
const DocumentManagement = ({ projectId = null, showProjectFilter = true }) => {
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    discipline: '',
    search: ''
  });
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    category: '',
    discipline: '',
    document_number: '',
    is_confidential: false,
    tags: '',
    project_id: projectId
  });
  const [selectedFile, setSelectedFile] = useState(null);

  // EPC Document Categories
  const documentCategories = [
    { value: 'engineering_drawing', label: 'Engineering Drawing' },
    { value: 'piping_drawing', label: 'P&ID Drawing' },
    { value: 'electrical_drawing', label: 'Electrical Drawing' },
    { value: 'instrument_drawing', label: 'Instrument Drawing' },
    { value: 'technical_specification', label: 'Technical Specification' },
    { value: 'project_report', label: 'Project Report' },
    { value: 'safety_document', label: 'Safety Document' },
    { value: 'compliance_document', label: 'Compliance Document' },
    { value: 'meeting_minutes', label: 'Meeting Minutes' },
    { value: 'vendor_document', label: 'Vendor Document' },
    { value: 'as_built_document', label: 'As-Built Document' },
    { value: 'procedure', label: 'Procedure' },
    { value: 'manual', label: 'Manual' },
    { value: 'certificate', label: 'Certificate' },
    { value: 'other', label: 'Other' }
  ];

  const documentStatuses = [
    { value: 'draft', label: 'Draft' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'superseded', label: 'Superseded' },
    { value: 'archived', label: 'Archived' }
  ];

  const disciplines = [
    'Mechanical Engineering',
    'Electrical Engineering',
    'Process Engineering',
    'Civil Engineering',
    'Instrumentation & Control',
    'Piping Engineering',
    'Safety Engineering',
    'Environmental Engineering'
  ];

  useEffect(() => {
    fetchDocuments();
  }, [projectId]);

  useEffect(() => {
    applyFilters();
  }, [documents, filters]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (projectId) params.append('project_id', projectId);
      
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/documents?${params}`);
      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...documents];

    if (filters.category) {
      filtered = filtered.filter(doc => doc.category === filters.category);
    }
    if (filters.status) {
      filtered = filtered.filter(doc => doc.status === filters.status);
    }
    if (filters.discipline) {
      filtered = filtered.filter(doc => doc.discipline === filters.discipline);
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(searchLower) ||
        doc.description.toLowerCase().includes(searchLower) ||
        doc.document_number?.toLowerCase().includes(searchLower) ||
        doc.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    setFilteredDocuments(filtered);
  };

  const handleFileSelect = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please select a file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', uploadData.title);
    formData.append('description', uploadData.description);
    formData.append('category', uploadData.category);
    if (uploadData.project_id) formData.append('project_id', uploadData.project_id);
    if (uploadData.discipline) formData.append('discipline', uploadData.discipline);
    if (uploadData.document_number) formData.append('document_number', uploadData.document_number);
    formData.append('is_confidential', uploadData.is_confidential);
    formData.append('tags', uploadData.tags);

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/documents/upload`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        setShowUploadModal(false);
        setUploadData({
          title: '', description: '', category: '', discipline: '', 
          document_number: '', is_confidential: false, tags: '', project_id: projectId
        });
        setSelectedFile(null);
        fetchDocuments();
      } else {
        const error = await response.json();
        alert(`Upload failed: ${error.detail}`);
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Upload failed. Please try again.');
    }
  };

  const handleDownload = async (documentId, fileName) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/documents/${documentId}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Download failed. Please try again.');
    }
  };

  const handleStatusUpdate = async (documentId, newStatus) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/documents/${documentId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchDocuments();
      }
    } catch (error) {
      console.error('Error updating document status:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'superseded': return 'bg-orange-100 text-orange-800';
      case 'archived': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'engineering_drawing': return 'bg-purple-100 text-purple-800';
      case 'safety_document': return 'bg-red-100 text-red-800';
      case 'compliance_document': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Document Management</h1>
          <p className="text-gray-600">Manage engineering documents, drawings, and compliance files</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
        >
          <UploadIcon className="h-5 w-5 inline mr-2" />
          Upload Document
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <select
            value={filters.category}
            onChange={(e) => setFilters({...filters, category: e.target.value})}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {documentCategories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            {documentStatuses.map(status => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>

          <select
            value={filters.discipline}
            onChange={(e) => setFilters({...filters, discipline: e.target.value})}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">All Disciplines</option>
            {disciplines.map(discipline => (
              <option key={discipline} value={discipline}>{discipline}</option>
            ))}
          </select>

          <button
            onClick={() => setFilters({ category: '', status: '', discipline: '', search: '' })}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading documents...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map(document => (
            <div key={document.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <DocumentIcon className="h-8 w-8 text-purple-600 flex-shrink-0" />
                <div className="flex gap-2">
                  {document.is_confidential && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                      Confidential
                    </span>
                  )}
                </div>
              </div>

              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{document.title}</h3>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{document.description}</p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(document.category)}`}>
                    {documentCategories.find(c => c.value === document.category)?.label || document.category}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(document.status)}`}>
                    {documentStatuses.find(s => s.value === document.status)?.label || document.status}
                  </span>
                </div>

                {document.discipline && (
                  <div className="text-sm text-gray-600">
                    <strong>Discipline:</strong> {document.discipline}
                  </div>
                )}

                {document.document_number && (
                  <div className="text-sm text-gray-600">
                    <strong>Doc #:</strong> {document.document_number}
                  </div>
                )}

                <div className="text-sm text-gray-600">
                  <strong>Size:</strong> {formatFileSize(document.file_size)} • <strong>Version:</strong> {document.version}
                </div>

                {document.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {document.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-xs rounded">
                        {tag}
                      </span>
                    ))}
                    {document.tags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-xs rounded">
                        +{document.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleDownload(document.id, document.file_name)}
                  className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                >
                  <DownloadIcon className="h-4 w-4 inline mr-1" />
                  Download
                </button>

                {document.status !== 'approved' && (
                  <button
                    onClick={() => handleStatusUpdate(document.id, 'approved')}
                    className="bg-green-100 hover:bg-green-200 text-green-700 py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                  >
                    <ApprovalIcon className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="mt-3 text-xs text-gray-500">
                Created: {new Date(document.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredDocuments.length === 0 && !loading && (
        <div className="text-center py-12">
          <DocumentIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Documents Found</h3>
          <p className="text-gray-600 mb-4">
            {documents.length === 0 ? "Upload your first document to get started" : "Try adjusting your filters"}
          </p>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Upload Document</h3>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Document Title"
                  value={uploadData.title}
                  onChange={(e) => setUploadData({...uploadData, title: e.target.value})}
                  className="col-span-2 w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />

                <textarea
                  placeholder="Description"
                  value={uploadData.description}
                  onChange={(e) => setUploadData({...uploadData, description: e.target.value})}
                  className="col-span-2 w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent h-24"
                  required
                />

                <select
                  value={uploadData.category}
                  onChange={(e) => setUploadData({...uploadData, category: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Category</option>
                  {documentCategories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>

                <select
                  value={uploadData.discipline}
                  onChange={(e) => setUploadData({...uploadData, discipline: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select Discipline (Optional)</option>
                  {disciplines.map(discipline => (
                    <option key={discipline} value={discipline}>{discipline}</option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Document Number (Optional)"
                  value={uploadData.document_number}
                  onChange={(e) => setUploadData({...uploadData, document_number: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />

                <input
                  type="text"
                  placeholder="Tags (comma-separated)"
                  value={uploadData.tags}
                  onChange={(e) => setUploadData({...uploadData, tags: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />

                <div className="col-span-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={uploadData.is_confidential}
                      onChange={(e) => setUploadData({...uploadData, is_confidential: e.target.checked})}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Mark as Confidential</span>
                  </label>
                </div>

                <div className="col-span-2">
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                  {selectedFile && (
                    <p className="text-sm text-gray-600 mt-2">
                      Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-medium transition-colors"
                >
                  Upload Document
                </button>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

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

  const getEpicForTask = (taskEpicId) => {
    return epics.find(epic => epic.id === taskEpicId);
  };

  const getSprintForTask = (taskSprintId) => {
    return sprints.find(sprint => sprint.id === taskSprintId);
  };

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    // If dropped outside a droppable area or in the same position
    if (!destination || 
        (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }

    // Map droppableId to status
    const statusMap = {
      'todo': 'todo',
      'in_progress': 'in_progress', 
      'review': 'review',
      'done': 'done'
    };

    const newStatus = statusMap[destination.droppableId];
    if (newStatus && onStatusChange) {
      // Call the status change handler which should update the backend and refresh data
      onStatusChange(draggableId, newStatus);
    }

    // Call additional drag end handler if provided
    if (onDragEnd) {
      onDragEnd(result);
    }
  };

  const columns = [
    { key: 'todo', title: 'To Do', count: kanbanData.todo.length, color: 'border-l-gray-400' },
    { key: 'in_progress', title: 'In Progress', count: kanbanData.in_progress.length, color: 'border-l-blue-400' },
    { key: 'review', title: 'Review', count: kanbanData.review.length, color: 'border-l-yellow-400' },
    { key: 'done', title: 'Done', count: kanbanData.done.length, color: 'border-l-green-400' }
  ];

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {columns.map(column => (
            <div key={column.key} className={`kanban-column border-l-4 ${column.color}`}>
              <div className="kanban-column-header">
                {column.title} ({column.count})
              </div>
              
              <Droppable droppableId={column.key}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-3 min-h-32 transition-colors duration-200 ${
                      snapshot.isDraggingOver ? 'bg-purple-50 rounded-lg' : ''
                    }`}
                  >
                    {kanbanData[column.key].map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`kanban-task group transition-all duration-200 ${
                              snapshot.isDragging 
                                ? 'transform rotate-2 shadow-2xl bg-white' 
                                : 'hover:shadow-md'
                            }`}
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
                            
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
                            
                            {/* Epic and Sprint badges */}
                            <div className="flex flex-wrap gap-1 mb-3">
                              {task.epic_id && (
                                <EpicBadge epic={getEpicForTask(task.epic_id)} compact />
                              )}
                              {task.sprint_id && (
                                <SprintBadge sprint={getSprintForTask(task.sprint_id)} compact />
                              )}
                              {task.story_points && (
                                <StoryPointBadge points={task.story_points} />
                              )}
                            </div>
                            
                            <div className="flex items-center justify-between mb-3">
                              <PriorityBadge priority={task.priority} />
                              {task.assigned_to && (
                                <div className="flex items-center text-xs text-gray-600">
                                  <UserIcon className="h-3 w-3 mr-1" />
                                  <span className="truncate max-w-16">
                                    {users.find(u => u.id === task.assigned_to)?.name || 'Unknown'}
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

                            {/* Quick action buttons */}
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
  EpicIcon,
  SprintIcon,
  StoryPointIcon,
  BurndownIcon,
  PriorityBadge,
  StatusBadge,
  StoryPointBadge,
  EpicBadge,
  SprintBadge,
  ProgressBar,
  TaskCard,
  GanttChart,
  ResourceManagement,
  DragDropKanbanBoard,
  DeleteConfirmModal
};

export default Components;