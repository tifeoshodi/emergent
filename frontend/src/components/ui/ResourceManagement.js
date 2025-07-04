import React from 'react';
import { ResourceIcon, UserIcon } from '../icons';
import ProgressBar from './ProgressBar';

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
          {resources.resources.map((resource) => (
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
                <ProgressBar progress={resource.utilization_percent} className="mt-2" />
              </div>
              <div className="mt-3">
                <p className="text-sm text-gray-600 mb-2">Active Tasks: {resource.tasks.length}</p>
                <div className="flex flex-wrap gap-1">
                  {resource.tasks.slice(0, 3).map((task) => (
                    <span key={task.id} className="px-2 py-1 bg-gray-100 text-xs rounded">
                      {task.title}
                    </span>
                  ))}
                  {resource.tasks.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-xs rounded">+{resource.tasks.length - 3} more</span>
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

export default ResourceManagement;
