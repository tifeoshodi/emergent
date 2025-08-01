import React, { useState } from 'react';
import { Button, Card, CardHeader, CardTitle, CardContent } from '../ui';

const TaskAssignmentModal = ({ task, teamMembers, onAssign, onClose }) => {
  const [selectedAssignee, setSelectedAssignee] = useState(task.assigned_to || '');
  const [assigning, setAssigning] = useState(false);

  const handleAssign = async () => {
    if (!selectedAssignee) {
      alert('Please select a team member to assign this task to.');
      return;
    }

    setAssigning(true);
    try {
      await onAssign(task.id, selectedAssignee);
    } catch (error) {
      console.error('Assignment failed:', error);
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassign = async () => {
    setAssigning(true);
    try {
      await onAssign(task.id, null);
    } catch (error) {
      console.error('Unassignment failed:', error);
    } finally {
      setAssigning(false);
    }
  };

  const getRoleDisplayName = (role) => {
    const roleMap = {
      'senior_engineer_1': 'Senior Engineer I',
      'senior_engineer_2': 'Senior Engineer II',
      'intermediate_engineer': 'Intermediate Engineer',
      'junior_engineer': 'Junior Engineer'
    };
    return roleMap[role] || role.replace('_', ' ').toUpperCase();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">Task Assignment</CardTitle>
                <p className="text-sm text-gray-500 mt-1">Assign task to team member</p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6 p-6">
            {/* Task Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Task Details</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-gray-700">Title: </span>
                  <span className="text-sm text-gray-900">{task.title}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Description: </span>
                  <span className="text-sm text-gray-900">{task.description}</span>
                </div>
                <div className="flex gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Priority: </span>
                    <span className={`text-sm font-medium ${
                      task.priority === 'critical' ? 'text-red-600' :
                      task.priority === 'high' ? 'text-orange-600' :
                      task.priority === 'medium' ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {task.priority?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Status: </span>
                    <span className="text-sm text-gray-900">{task.status?.replace('_', ' ').toUpperCase()}</span>
                  </div>
                </div>
                {task.due_date && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Due Date: </span>
                    <span className="text-sm text-gray-900">{new Date(task.due_date).toLocaleDateString()}</span>
                  </div>
                )}
                {task.tags?.includes('mdr') && (
                  <div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      MDR Document Task
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Current Assignment */}
            {task.assigned_to && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Currently Assigned To</h4>
                <div className="text-sm text-blue-700">
                  {(() => {
                    const assignee = teamMembers.find(m => m.id === task.assigned_to);
                    return assignee ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-medium">
                            {assignee.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{assignee.name}</p>
                          <p className="text-xs">{getRoleDisplayName(assignee.role)}</p>
                        </div>
                      </div>
                    ) : 'Unknown User';
                  })()}
                </div>
              </div>
            )}

            {/* Team Member Selection */}
            <div>
              <label htmlFor="assignee-select" className="block text-sm font-medium text-gray-700 mb-2">
                Assign to Team Member
              </label>
              <select
                id="assignee-select"
                value={selectedAssignee}
                onChange={(e) => setSelectedAssignee(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Select team member...</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} - {getRoleDisplayName(member.role)}
                  </option>
                ))}
              </select>
            </div>

            {/* Team Members List */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Available Team Members</h4>
              <div className="space-y-2">
                {teamMembers.length === 0 ? (
                  <p className="text-sm text-gray-500">No team members available in this discipline.</p>
                ) : (
                  teamMembers.map((member) => (
                    <div 
                      key={member.id} 
                      className={`flex items-center justify-between p-3 border rounded-lg ${
                        selectedAssignee === member.id ? 'border-green-500 bg-green-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{member.name}</p>
                          <p className="text-xs text-gray-500">{getRoleDisplayName(member.role)}</p>
                          {member.availability && (
                            <p className="text-xs text-gray-500">
                              Availability: {(member.availability * 100).toFixed(0)}%
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedAssignee(member.id)}
                        className={`px-3 py-1 text-xs rounded-md ${
                          selectedAssignee === member.id
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {selectedAssignee === member.id ? 'Selected' : 'Select'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                onClick={onClose}
                className="px-4 py-2 text-sm bg-gray-300 hover:bg-gray-400 text-gray-700"
              >
                Cancel
              </Button>
              
              {task.assigned_to && (
                <Button
                  onClick={handleUnassign}
                  disabled={assigning}
                  className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white"
                >
                  {assigning ? 'Unassigning...' : 'Unassign'}
                </Button>
              )}
              
              <Button
                onClick={handleAssign}
                disabled={!selectedAssignee || assigning}
                className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-300"
              >
                {assigning ? 'Assigning...' : 'Assign Task'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TaskAssignmentModal;