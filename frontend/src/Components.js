import React from 'react';

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

// Task Card Component
const TaskCard = ({ task, users, onStatusChange }) => {
  const assignedUser = users.find(user => user.id === task.assigned_to);
  
  const handleStatusChange = (newStatus) => {
    onStatusChange(task.id, newStatus);
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="task-card">
      <div className="mb-3">
        <h4 className="font-semibold text-gray-900 mb-1">{task.title}</h4>
        <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
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
  );
};

// Kanban Board Component
const KanbanBoard = ({ kanbanData, users, onStatusChange }) => {
  const columns = [
    { key: 'todo', title: 'To Do', count: kanbanData.todo.length },
    { key: 'in_progress', title: 'In Progress', count: kanbanData.in_progress.length },
    { key: 'review', title: 'Review', count: kanbanData.review.length },
    { key: 'done', title: 'Done', count: kanbanData.done.length }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {columns.map(column => (
        <div key={column.key} className="kanban-column">
          <div className="kanban-column-header">
            {column.title} ({column.count})
          </div>
          <div className="space-y-3">
            {kanbanData[column.key].map(task => (
              <div key={task.id} className="kanban-task">
                <h5 className="font-semibold text-gray-900 mb-2">{task.title}</h5>
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
  PriorityBadge,
  StatusBadge,
  TaskCard,
  KanbanBoard
};

export default Components;