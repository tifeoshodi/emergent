import React, { useState } from 'react';
import TaskDetailModal from '../modals/TaskDetailModal';

const EnhancedTaskCard = ({ task, onClick, onUpdate, currentUser }) => {
  const [showDetail, setShowDetail] = useState(false);

  const handleCardClick = (e) => {
    e.stopPropagation();
    setShowDetail(true);
  };

  const getTaskPriorityColor = (priority) => {
    const colors = {
      'critical': 'border-l-red-500 bg-red-50',
      'high': 'border-l-orange-500 bg-orange-50',
      'medium': 'border-l-yellow-500 bg-yellow-50',
      'low': 'border-l-green-500 bg-green-50'
    };
    return colors[priority] || 'border-l-gray-500 bg-gray-50';
  };

  const getStatusColor = (status) => {
    const colors = {
      'todo': 'bg-blue-100 text-blue-800',
      'in_progress': 'bg-yellow-100 text-yellow-800',
      'review': 'bg-purple-100 text-purple-800',
      'review_dic': 'bg-purple-100 text-purple-800',
      'review_idc': 'bg-indigo-100 text-indigo-800',
      'review_dcc': 'bg-orange-100 text-orange-800',
      'done': 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const isOverdue = () => {
    if (!task.due_date || task.status === 'done') return false;
    return new Date(task.due_date) < new Date();
  };

  const isDueSoon = () => {
    if (!task.due_date || task.status === 'done') return false;
    const dueDate = new Date(task.due_date);
    const threeDaysFromNow = new Date(Date.now() + (3 * 24 * 60 * 60 * 1000));
    return dueDate <= threeDaysFromNow && dueDate >= new Date();
  };

  const getDaysUntilDue = () => {
    if (!task.due_date) return null;
    const dueDate = new Date(task.due_date);
    const today = new Date();
    const timeDiff = dueDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysDiff;
  };

  const daysUntilDue = getDaysUntilDue();

  return (
    <>
      <div
        onClick={handleCardClick}
        className={`p-3 border-l-4 rounded-r-md cursor-pointer hover:shadow-md transition-shadow ${getTaskPriorityColor(task.priority)} ${
          isOverdue() ? 'border-2 border-red-300' : ''
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
          <h4 className="text-sm font-medium text-gray-900 line-clamp-2 flex-1 pr-2">{task.title}</h4>
          <div className="flex flex-col space-y-1">
            {task.tags?.includes('mdr') && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                MDR
              </span>
            )}
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${getStatusColor(task.status)}`}>
              {task.status?.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>

        {/* Due Date Warning */}
        {isOverdue() && (
          <div className="flex items-center text-red-600 text-xs mb-2">
            <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            Overdue by {Math.abs(daysUntilDue)} days
          </div>
        )}

        {isDueSoon() && !isOverdue() && (
          <div className="flex items-center text-orange-600 text-xs mb-2">
            <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Due in {daysUntilDue} days
          </div>
        )}

        {/* Task Details */}
        <div className="space-y-1 text-xs text-gray-500">
          {task.due_date && (
            <div className="flex items-center">
              <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Due: {new Date(task.due_date).toLocaleDateString()}
            </div>
          )}
          
          <div className="flex items-center">
            <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Priority: {task.priority || 'medium'}
          </div>

          {task.progress_percent !== undefined && task.progress_percent !== null && (
            <div className="flex items-center">
              <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Progress: {task.progress_percent}%
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {task.progress_percent !== undefined && task.progress_percent !== null && (
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" 
                style={{ width: `${task.progress_percent}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-200">
          <div className="flex space-x-2">
            {/* File attachment indicator */}
            <div className="flex items-center text-gray-400">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <span className="ml-1 text-xs">0</span>
            </div>
            
            {/* Comments indicator */}
            <div className="flex items-center text-gray-400">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="ml-1 text-xs">0</span>
            </div>
          </div>
          
          <div className="text-xs text-gray-400">
            Click to open
          </div>
        </div>
      </div>

      {/* Task Detail Modal */}
      {showDetail && (
        <TaskDetailModal
          task={task}
          onClose={() => setShowDetail(false)}
          onUpdate={onUpdate}
          currentUser={currentUser}
        />
      )}
    </>
  );
};

export default EnhancedTaskCard;