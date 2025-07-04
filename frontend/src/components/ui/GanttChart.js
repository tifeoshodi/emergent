import React from 'react';
import { ChartIcon, TaskIcon } from '../icons';

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
    return { left: `${(startOffset / totalDays) * 100}%`, width: `${(duration / totalDays) * 100}%` };
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
          <div className="bg-gray-50 border-b border-gray-200 p-4">
            <div className="flex">
              <div className="w-64 flex-shrink-0"></div>
              <div className="flex-1 relative h-8">
                {Array.from({ length: Math.min(totalDays, 30) }, (_, i) => {
                  const date = new Date(startDate);
                  date.setDate(date.getDate() + Math.floor((i / 30) * totalDays));
                  return (
                    <div key={i} className="absolute text-xs text-gray-600" style={{ left: `${(i / 30) * 100}%` }}>
                      {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {ganttData.tasks.map((task) => {
              const assignedUser = users.find((user) => user.id === task.assigned_to);
              const position = getTaskPosition(task);
              return (
                <div key={task.id} className="flex items-center p-4 hover:bg-gray-50">
                  <div className="w-64 flex-shrink-0 pr-4">
                    <div className="flex items-center">
                      <TaskIcon className="h-4 w-4 text-gray-600 mr-2" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                        {assignedUser && <p className="text-xs text-gray-600">{assignedUser.name}</p>}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 relative h-8">
                    <div className={`absolute h-6 rounded ${getTaskColor(task)} flex items-center px-2`} style={position}>
                      <div className="text-white text-xs font-medium truncate">{task.progress_percent}%</div>
                      <div className="absolute top-0 left-0 h-full bg-green-400 opacity-50 rounded" style={{ width: `${task.progress_percent}%` }} />
                    </div>
                  </div>
                  <div className="w-20 text-right text-sm text-gray-600">{task.duration_days}d</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GanttChart;
