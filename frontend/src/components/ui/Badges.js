import React from 'react';
import { StoryPointIcon, EpicIcon, SprintIcon } from '../icons';

export const PriorityBadge = ({ priority }) => {
  const getColorClass = (value) => {
    switch (value) {
      case 'low': return 'priority-low';
      case 'medium': return 'priority-medium';
      case 'high': return 'priority-high';
      case 'critical': return 'priority-critical';
      default: return 'priority-medium';
    }
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getColorClass(priority)}`}>{priority.toUpperCase()}</span>
  );
};

export const StatusBadge = ({ status }) => {
  const getColorClass = (value) => {
    switch (value) {
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
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getColorClass(status)}`}>{status.replace('_', ' ').toUpperCase()}</span>
  );
};

export const StoryPointBadge = ({ points }) => {
  if (!points) return null;
  return (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
      <StoryPointIcon className="h-3 w-3 mr-1" />
      {points}
    </span>
  );
};

export const EpicBadge = ({ epic, compact = false }) => {
  if (!epic) return null;
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 ${compact ? 'max-w-20 truncate' : ''}`}> 
      <EpicIcon className="h-3 w-3 mr-1 flex-shrink-0" />
      {compact ? epic.title.substring(0, 8) + '...' : epic.title}
    </span>
  );
};

export const SprintBadge = ({ sprint, compact = false }) => {
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

export default { PriorityBadge, StatusBadge, StoryPointBadge, EpicBadge, SprintBadge };
