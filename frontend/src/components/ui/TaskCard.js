import React, { useState } from 'react';
import { UserIcon, CalendarIcon, ClockIcon, DeleteIcon } from '../icons';
import DeleteConfirmModal from './DeleteConfirmModal';
import ProgressBar from './ProgressBar';
import { PriorityBadge, StatusBadge } from './Badges';

const TaskCard = ({ task, users, onStatusChange, onDelete }) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const assignedUser = users.find((u) => u.id === task.assigned_to);

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

export default TaskCard;
