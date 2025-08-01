import React, { useState, useEffect } from 'react';
import pmfusionAPI from '../../lib/api';
import { Button, Card, CardHeader, CardTitle, CardContent } from '../ui';

const ProjectDetailsModal = ({ project, onClose, onProjectUpdated, onProjectDeleted, currentUser }) => {
  const [projectStats, setProjectStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    loadProjectStats();
  }, [project.id]);

  const loadProjectStats = async () => {
    try {
      setLoading(true);
      const [mdrStats, taskStats] = await Promise.all([
        pmfusionAPI.getMDRDashboard(project.id).catch(() => ({})),
        pmfusionAPI.request(`/projects/${project.id}/dashboard`).catch(() => ({}))
      ]);
      
      setProjectStats({ mdr: mdrStats, tasks: taskStats });
    } catch (error) {
      console.error('Failed to load project stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    setDeleting(true);
    try {
      // Use force delete to remove project and all associated data
      await pmfusionAPI.request(`/projects/${project.id}/force`, 'DELETE');
      onProjectDeleted(project.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete project:', error);
      
      // Provide more specific error message
      let errorMessage = 'Failed to delete project. Please try again.';
      if (error.message && error.message.includes('task')) {
        errorMessage = 'Project contains tasks and data. Deletion failed. Please contact support if this continues.';
      } else if (error.message && error.message.includes('404')) {
        errorMessage = 'Project not found or already deleted.';
      } else if (error.message && error.message.includes('500')) {
        errorMessage = 'Database connection error. Please check your connection and try again.';
      }
      
      alert(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'planning': 'bg-yellow-100 text-yellow-800',
      'active': 'bg-green-100 text-green-800',
      'on_hold': 'bg-orange-100 text-orange-800',
      'completed': 'bg-blue-100 text-blue-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const calculateDuration = () => {
    if (!project.start_date) return 'Unknown';
    
    const startDate = new Date(project.start_date);
    const endDate = project.end_date ? new Date(project.end_date) : new Date();
    
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} days`;
    } else if (diffDays < 365) {
      const months = Math.round(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''}`;
    } else {
      const years = Math.round(diffDays / 365);
      return `${years} year${years > 1 ? 's' : ''}`;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b">
            <div className="flex justify-between items-start">
              <div className="flex-1 pr-4">
                <div className="flex items-center space-x-3 mb-2">
                  <CardTitle className="text-xl">{project.name}</CardTitle>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                    {project.status?.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{project.description}</p>
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
          
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Project Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Project Information</h3>
                
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Start Date</span>
                      <p className="text-sm text-gray-900">{formatDate(project.start_date)}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">End Date</span>
                      <p className="text-sm text-gray-900">{formatDate(project.end_date)}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Duration</span>
                      <p className="text-sm text-gray-900">{calculateDuration()}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Created</span>
                      <p className="text-sm text-gray-900">{formatDate(project.created_at)}</p>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium text-gray-700">Project Manager</span>
                    <p className="text-sm text-gray-900">{currentUser.name}</p>
                  </div>
                </div>
              </div>

              {/* Project Statistics */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Project Statistics</h3>
                
                {loading ? (
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Loading statistics...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* MDR Statistics */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">Document Register</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-xl font-bold text-blue-700">{projectStats.mdr?.total_documents || 0}</div>
                          <div className="text-xs text-blue-600">Total Documents</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-red-600">{projectStats.mdr?.overdue_documents || 0}</div>
                          <div className="text-xs text-red-600">Overdue</div>
                        </div>
                      </div>
                    </div>

                    {/* Task Statistics */}
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-medium text-green-900 mb-2">Task Progress</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-xl font-bold text-green-700">{projectStats.tasks?.total_tasks || 0}</div>
                          <div className="text-xs text-green-600">Total Tasks</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-green-600">{projectStats.tasks?.completed_tasks || 0}</div>
                          <div className="text-xs text-green-600">Completed</div>
                        </div>
                      </div>
                      
                      {projectStats.tasks?.total_tasks > 0 && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-green-700 mb-1">
                            <span>Progress</span>
                            <span>{Math.round((projectStats.tasks.completed_tasks / projectStats.tasks.total_tasks) * 100)}%</span>
                          </div>
                          <div className="w-full bg-green-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                              style={{ 
                                width: `${(projectStats.tasks.completed_tasks / projectStats.tasks.total_tasks) * 100}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-6 border-t mt-6">
              <div>
                {!showDeleteConfirm ? (
                  <Button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white"
                  >
                    Delete Project
                  </Button>
                ) : (
                  <div className="flex flex-col space-y-2">
                    <div className="text-sm text-red-600">
                      <div className="font-medium">Are you sure you want to delete this project?</div>
                      <div className="text-xs text-red-500 mt-1">This will permanently delete all tasks, documents, and associated data.</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={handleDeleteProject}
                        disabled={deleting}
                        className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 text-white"
                      >
                        {deleting ? 'Deleting...' : 'Yes, Delete All Data'}
                      </Button>
                      <Button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-3 py-1 text-xs bg-gray-300 hover:bg-gray-400 text-gray-700"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-3">
                <Button
                  onClick={onClose}
                  className="px-4 py-2 text-sm bg-gray-300 hover:bg-gray-400 text-gray-700"
                >
                  Close
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProjectDetailsModal;