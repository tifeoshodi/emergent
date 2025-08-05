import React, { useState, useEffect } from 'react';
import pmfusionAPI from '../../lib/api';
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Label } from '../ui';
import ProjectCreateModal from '../modals/ProjectCreateModal';
import ProjectDetailsModal from '../modals/ProjectDetailsModal';
import DisciplineRegisterModal from '../modals/DisciplineRegisterModal';
import ReportGenerator from '../ReportGenerator';

const SchedulerDashboard = ({ user, onLogout }) => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [mdrFile, setMdrFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [mdrEntries, setMdrEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const [showDisciplineRegister, setShowDisciplineRegister] = useState(false);
  const [showReportGenerator, setShowReportGenerator] = useState(false);
  const [selectedProjectForDetails, setSelectedProjectForDetails] = useState(null);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadMdrEntries();
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      const data = await pmfusionAPI.getProjects();
      setProjects(data);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const handleProjectCreated = (newProject) => {
    setProjects(prev => [...prev, newProject]);
    setSelectedProject(newProject.id);
    setShowCreateProject(false);
  };

  const handleProjectDeleted = (projectId) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    if (selectedProject === projectId) {
      setSelectedProject('');
      setMdrEntries([]);
    }
    setShowProjectDetails(false);
  };

  const handleViewProject = (project) => {
    setSelectedProjectForDetails(project);
    setShowProjectDetails(true);
  };

  const handleOpenDisciplineRegister = () => {
    if (!selectedProject) {
      alert('Please select a project first');
      return;
    }
    setShowDisciplineRegister(true);
  };

  const loadMdrEntries = async () => {
    try {
      setLoading(true);
      const data = await pmfusionAPI.request(`/mdr/entries/${selectedProject}`);
      setMdrEntries(data);
    } catch (error) {
      console.error('Failed to load MDR entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      setMdrFile(file);
      setUploadResult(null);
    } else {
      alert('Please select a valid Excel file (.xlsx or .xls)');
      event.target.value = '';
    }
  };

  const handleMdrUpload = async () => {
    if (!mdrFile || !selectedProject) {
      alert('Please select both a project and an MDR file');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', mdrFile);
      formData.append('project_id', selectedProject);

      const result = await pmfusionAPI.uploadFile('/mdr/upload', formData);
      setUploadResult(result);
      setMdrFile(null);
      document.getElementById('mdr-file-input').value = '';
      await loadMdrEntries(); // Refresh the entries
    } catch (error) {
      console.error('MDR upload failed:', error);
      alert('Failed to upload MDR file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const generateWbs = async () => {
    if (!selectedProject) {
      alert('Please select a project');
      return;
    }

    setLoading(true);
    try {
      const result = await pmfusionAPI.request(`/projects/${selectedProject}/wbs`, 'POST');
      alert('WBS generated successfully! Tasks have been synced to discipline dashboards.');
    } catch (error) {
      console.error('WBS generation failed:', error);
      alert('Failed to generate WBS. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Not Started': 'bg-gray-100 text-gray-800',
      'In Progress': 'bg-blue-100 text-blue-800',
      'Under Review': 'bg-yellow-100 text-yellow-800',
      'Approved': 'bg-green-100 text-green-800',
      'Completed': 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="h-8 w-8 bg-blue-600 rounded-md flex items-center justify-center">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Scheduler Dashboard</h1>
                <p className="text-sm text-gray-500">MDR Processing & WBS Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">Scheduler</p>
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
        {/* Project Management */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Project Management</CardTitle>
                <p className="text-sm text-gray-500 mt-1">Create, manage, and configure projects for MDR processing</p>
              </div>
              <Button 
                onClick={() => setShowCreateProject(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Create New Project
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Project Selection */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
                <div className="lg:col-span-2">
                  <Label htmlFor="project-select" className="text-sm font-medium text-gray-700">
                    Select Active Project
                  </Label>
                  <select 
                    id="project-select"
                    value={selectedProject} 
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Choose a project...</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name} ({project.status?.replace('_', ' ').toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  {selectedProject && (
                    <>
                      <Button 
                        onClick={() => handleViewProject(projects.find(p => p.id === selectedProject))}
                        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
                      >
                        View Details
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              {selectedProject && (
                <div className="flex flex-wrap gap-3 pt-3 border-t">
                  <Button 
                    onClick={generateWbs}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {loading ? 'Generating...' : 'Generate WBS'}
                  </Button>
                  <Button 
                    onClick={handleOpenDisciplineRegister}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Discipline Register
                  </Button>
                </div>
              )}

              {/* Project Info */}
              {selectedProject && projects.find(p => p.id === selectedProject) && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  {(() => {
                    const project = projects.find(p => p.id === selectedProject);
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-blue-800">Status:</span>
                          <span className="ml-2 text-blue-700">{project.status?.replace('_', ' ').toUpperCase()}</span>
                        </div>
                        <div>
                          <span className="font-medium text-blue-800">Start Date:</span>
                          <span className="ml-2 text-blue-700">
                            {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Not set'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-blue-800">MDR Entries:</span>
                          <span className="ml-2 text-blue-700">{mdrEntries.length}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('upload')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'upload'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                MDR Upload
              </button>
              <button
                onClick={() => setActiveTab('entries')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'entries'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                MDR Entries ({mdrEntries.length})
              </button>
              {selectedProject && (
                <button
                  onClick={() => setShowReportGenerator(true)}
                  className="py-2 px-4 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md ml-4"
                >
                  Generate Report
                </button>
              )}
            </nav>
          </div>
        </div>

        {/* MDR Upload Tab */}
        {activeTab === 'upload' && (
          <Card>
            <CardHeader>
              <CardTitle>Upload Master Document Register</CardTitle>
              <p className="text-sm text-gray-600">
                Upload an Excel file containing the Master Document Register to automatically create kanban activities for each discipline.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedProject && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <p className="text-yellow-800">Please select a project before uploading an MDR file.</p>
                </div>
              )}
              
              <div className="space-y-3">
                <Label htmlFor="mdr-file-input" className="text-sm font-medium text-gray-700">
                  Select MDR Excel File
                </Label>
                <input
                  id="mdr-file-input"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  disabled={!selectedProject}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                />
                {mdrFile && (
                  <p className="text-sm text-gray-600">Selected: {mdrFile.name}</p>
                )}
              </div>

              <Button 
                onClick={handleMdrUpload}
                disabled={!mdrFile || !selectedProject || uploading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {uploading ? 'Processing MDR...' : 'Upload and Process MDR'}
              </Button>

              {uploadResult && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <h4 className="font-medium text-green-800 mb-2">Upload Successful</h4>
                  <div className="text-sm text-green-700 space-y-1">
                    <p>MDR Entries Created: {uploadResult.mdr_entries_created}</p>
                    <p>Kanban Tasks Created: {uploadResult.kanban_tasks_created}</p>
                    <p className="font-medium">{uploadResult.message}</p>
                  </div>
                </div>
              )}

              {/* Expected Format Info */}
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                <h4 className="font-medium text-gray-800 mb-2">Expected Excel Format</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Required Columns:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Doc Number (e.g., PMA-001, TS-001)</li>
                    <li>DOC Title (e.g., Project Basis of Design)</li>
                    <li>Category/Discipline (e.g., Process, Piping, Electrical)</li>
                    <li>Status (Not Started, In Progress, Under Review, etc.)</li>
                  </ul>
                  <p><strong>Optional Columns:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>IFR Date Planned, IFR Date Actual</li>
                    <li>IFA Date Planned, IFA Date Actual</li>
                    <li>IFC Date Planned, IFC Date Actual</li>
                    <li>Remarks</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* MDR Entries Tab */}
        {activeTab === 'entries' && selectedProject && (
          <Card>
            <CardHeader>
              <CardTitle>MDR Entries</CardTitle>
              <p className="text-sm text-gray-600">
                View and manage all MDR entries for the selected project.
              </p>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading MDR entries...</p>
                </div>
              ) : mdrEntries.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No MDR entries found for this project.</p>
                  <p className="text-sm text-gray-400 mt-1">Upload an MDR file to get started.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Doc Number
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Title
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Discipline
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          IFC Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {mdrEntries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {entry.doc_number}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {entry.doc_title}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {entry.category}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(entry.status)}`}>
                              {entry.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {entry.ifc_planned_date || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modals */}
      {showCreateProject && (
        <ProjectCreateModal
          onClose={() => setShowCreateProject(false)}
          onProjectCreated={handleProjectCreated}
          currentUser={user}
        />
      )}

      {showProjectDetails && selectedProjectForDetails && (
        <ProjectDetailsModal
          project={selectedProjectForDetails}
          onClose={() => setShowProjectDetails(false)}
          onProjectDeleted={handleProjectDeleted}
          currentUser={user}
        />
      )}

      {showDisciplineRegister && selectedProject && (
        <DisciplineRegisterModal
          project={projects.find(p => p.id === selectedProject)}
          onClose={() => setShowDisciplineRegister(false)}
          currentUser={user}
        />
      )}

      {showReportGenerator && selectedProject && (
        <ReportGenerator
          project={projects.find(p => p.id === selectedProject)}
          onClose={() => setShowReportGenerator(false)}
          currentUser={user}
        />
      )}
    </div>
  );
};

export default SchedulerDashboard;