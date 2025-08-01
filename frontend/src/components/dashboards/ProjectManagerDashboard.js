import React, { useState, useEffect } from 'react';
import pmfusionAPI from '../../lib/api';
import { Button, Card, CardHeader, CardTitle, CardContent } from '../ui';

const ProjectManagerDashboard = ({ user, onLogout }) => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [projectStats, setProjectStats] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadProjectStats();
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      const data = await pmfusionAPI.request('/projects');
      setProjects(data);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const loadProjectStats = async () => {
    try {
      setLoading(true);
      // Load various project statistics
      const [mdrStats, tasksData] = await Promise.all([
        pmfusionAPI.request(`/mdr/dashboard/${selectedProject}`).catch(() => ({})),
        pmfusionAPI.request(`/projects/${selectedProject}/dashboard`).catch(() => ({}))
      ]);
      
      setProjectStats({ mdr: mdrStats, tasks: tasksData });
    } catch (error) {
      console.error('Failed to load project stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleDisplayName = (role) => {
    const roleMap = {
      'project_manager': 'Project Manager',
      'contractor': 'Contractor'
    };
    return roleMap[role] || role.replace('_', ' ').toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="h-8 w-8 bg-purple-600 rounded-md flex items-center justify-center">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Project Overview</h1>
                <p className="text-sm text-gray-500">{getRoleDisplayName(user.role)} Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{getRoleDisplayName(user.role)}</p>
              </div>
              <Button 
                onClick={onLogout}
                className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 text-sm"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Project Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Project Selection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label htmlFor="project-select" className="block text-sm font-medium text-gray-700">
                  Select Project
                </label>
                <select 
                  id="project-select"
                  value={selectedProject} 
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">Choose a project...</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedProject && (
          <>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading project overview...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* MDR Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle>Document Register Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {projectStats.mdr && Object.keys(projectStats.mdr).length > 0 ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">{projectStats.mdr.total_documents || 0}</div>
                            <div className="text-sm text-gray-500">Total Documents</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">{projectStats.mdr.overdue_documents || 0}</div>
                            <div className="text-sm text-gray-500">Overdue</div>
                          </div>
                        </div>
                        
                        {projectStats.mdr.by_status && (
                          <div className="space-y-2">
                            <h4 className="font-medium text-gray-900">By Status</h4>
                            {Object.entries(projectStats.mdr.by_status).map(([status, count]) => (
                              <div key={status} className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">{status}</span>
                                <span className="text-sm font-medium text-gray-900">{count}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {projectStats.mdr.by_discipline && (
                          <div className="space-y-2">
                            <h4 className="font-medium text-gray-900">By Discipline</h4>
                            {Object.entries(projectStats.mdr.by_discipline).map(([discipline, count]) => (
                              <div key={discipline} className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">{discipline}</span>
                                <span className="text-sm font-medium text-gray-900">{count}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>No MDR data available for this project.</p>
                        <p className="text-sm">MDR files need to be uploaded by the Scheduler.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Task Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle>Task Progress Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {projectStats.tasks && Object.keys(projectStats.tasks).length > 0 ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">{projectStats.tasks.total_tasks || 0}</div>
                            <div className="text-sm text-gray-500">Total Tasks</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{projectStats.tasks.completed_tasks || 0}</div>
                            <div className="text-sm text-gray-500">Completed</div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">In Progress</span>
                            <span className="text-sm font-medium text-gray-900">{projectStats.tasks.in_progress_tasks || 0}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Overdue</span>
                            <span className="text-sm font-medium text-red-600">{projectStats.tasks.overdue_tasks || 0}</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        {projectStats.tasks.total_tasks > 0 && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Completion Progress</span>
                              <span>{Math.round((projectStats.tasks.completed_tasks / projectStats.tasks.total_tasks) * 100)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
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
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>No task data available for this project.</p>
                        <p className="text-sm">Tasks will appear after WBS generation.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Access Control Info */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Workflow Access Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <h3 className="font-medium text-gray-900 mb-1">Scheduler</h3>
                        <p className="text-sm text-gray-600">Uploads MDR files and generates WBS structure for discipline teams</p>
                      </div>

                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <h3 className="font-medium text-gray-900 mb-1">Team Leaders</h3>
                        <p className="text-sm text-gray-600">Manage discipline dashboards and assign tasks to team members</p>
                      </div>

                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <h3 className="font-medium text-gray-900 mb-1">Engineers</h3>
                        <p className="text-sm text-gray-600">View assigned tasks, upload deliverables, and track progress</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProjectManagerDashboard;