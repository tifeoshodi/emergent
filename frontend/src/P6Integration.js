import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Components from './Components';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// P6 Integration Dashboard Component
const P6Integration = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [p6Projects, setP6Projects] = useState([]);
  const [syncHistory, setSyncHistory] = useState([]);
  const [p6Status, setP6Status] = useState(null);

  useEffect(() => {
    loadP6Data();
  }, []);

  const loadP6Data = async () => {
    setLoading(true);
    try {
      const [statusRes, historyRes] = await Promise.all([
        axios.get(`${API}/p6/status`),
        axios.get(`${API}/p6/sync/history?limit=5`)
      ]);
      
      setP6Status(statusRes.data.p6_status);
      setSyncHistory(historyRes.data.sync_history);
    } catch (error) {
      console.error('Error loading P6 data:', error);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/p6/connection/test`);
      setConnectionStatus(response.data);
    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionStatus({
        status: 'error',
        message: 'Connection test failed',
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const loadP6Projects = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/p6/projects`);
      setP6Projects(response.data.projects || []);
    } catch (error) {
      console.error('Error loading P6 projects:', error);
      setP6Projects([]);
    } finally {
      setLoading(false);
    }
  };

  const syncFromP6 = async (options = {}) => {
    setLoading(true);
    try {
      const syncRequest = {
        sync_projects: true,
        sync_activities: true,
        sync_resources: true,
        sync_direction: 'p6_to_pmfusion',
        force_sync: false,
        ...options
      };
      
      const response = await axios.post(`${API}/p6/sync`, syncRequest);
      
      if (response.data.status === 'success') {
        alert('P6 sync completed successfully!');
        loadP6Data(); // Refresh data
      } else {
        alert(`Sync failed: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Sync failed:', error);
      alert(`Sync failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">P6 Connection Status</h3>
          <button
            onClick={testConnection}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Connection'}
          </button>
        </div>
        
        {connectionStatus ? (
          <div className={`p-4 rounded-xl ${
            connectionStatus.status === 'connected' ? 'bg-green-50 border border-green-200' :
            connectionStatus.status === 'error' ? 'bg-red-50 border border-red-200' :
            'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-3 ${
                connectionStatus.status === 'connected' ? 'bg-green-500' :
                connectionStatus.status === 'error' ? 'bg-red-500' :
                'bg-yellow-500'
              }`}></div>
              <div>
                <p className={`font-medium ${
                  connectionStatus.status === 'connected' ? 'text-green-800' :
                  connectionStatus.status === 'error' ? 'text-red-800' :
                  'text-yellow-800'
                }`}>
                  {connectionStatus.message}
                </p>
                {connectionStatus.host && (
                  <p className="text-sm text-gray-600">Host: {connectionStatus.host}</p>
                )}
                {connectionStatus.mock_mode && (
                  <p className="text-sm text-blue-600">Running in Mock Mode</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-gray-600">Click "Test Connection" to check P6 connectivity</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => syncFromP6()}
          disabled={loading}
          className="p-6 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl transition-colors disabled:opacity-50"
        >
          <Components.SyncIcon className="h-8 w-8 mx-auto mb-3" />
          <p className="font-semibold">Full Sync</p>
          <p className="text-sm text-purple-100">Sync all data from P6</p>
        </button>
        
        <button
          onClick={() => setActiveTab('projects')}
          className="p-6 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition-colors"
        >
          <Components.ProjectIcon className="h-8 w-8 mx-auto mb-3" />
          <p className="font-semibold">View P6 Projects</p>
          <p className="text-sm text-blue-100">Browse P6 project data</p>
        </button>
        
        <button
          onClick={() => setActiveTab('mapping')}
          className="p-6 bg-green-600 hover:bg-green-700 text-white rounded-2xl transition-colors"
        >
          <Components.MappingIcon className="h-8 w-8 mx-auto mb-3" />
          <p className="font-semibold">Data Mapping</p>
          <p className="text-sm text-green-100">Configure field mappings</p>
        </button>
        
        <button
          onClick={() => setActiveTab('export')}
          className="p-6 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl transition-colors"
        >
          <Components.ExportIcon className="h-8 w-8 mx-auto mb-3" />
          <p className="font-semibold">Export to P6</p>
          <p className="text-sm text-orange-100">Send data to P6</p>
        </button>
      </div>

      {/* Sync Statistics */}
      {p6Status && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Integration Statistics</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Projects</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Synced to PMFusion</span>
                  <span className="text-sm font-medium">{p6Status.sync_statistics?.projects?.synced || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total in P6</span>
                  <span className="text-sm font-medium">{p6Status.sync_statistics?.projects?.total_p6 || 0}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Activities/Tasks</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Synced to PMFusion</span>
                  <span className="text-sm font-medium">{p6Status.sync_statistics?.activities?.synced || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total in P6</span>
                  <span className="text-sm font-medium">{p6Status.sync_statistics?.activities?.total_p6 || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {p6Status.last_sync && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Last Sync</span>
                <span className="font-medium">{new Date(p6Status.last_sync.started_at).toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Sync History */}
      {syncHistory.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Sync History</h3>
          
          <div className="space-y-3">
            {syncHistory.map((sync, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    sync.status === 'completed' ? 'bg-green-500' :
                    sync.status === 'failed' ? 'bg-red-500' :
                    'bg-yellow-500'
                  }`}></div>
                  <div>
                    <p className="font-medium text-gray-900">{sync.message}</p>
                    <p className="text-sm text-gray-600">
                      {sync.projects_synced} projects, {sync.activities_synced} activities
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    {new Date(sync.started_at).toLocaleString()}
                  </p>
                  {sync.duration_seconds && (
                    <p className="text-xs text-gray-500">
                      {sync.duration_seconds.toFixed(1)}s
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderProjects = () => (
    <P6ProjectsView 
      projects={p6Projects} 
      onLoad={loadP6Projects}
      loading={loading}
    />
  );

  const renderMapping = () => (
    <P6MappingView />
  );

  const renderExport = () => (
    <P6ExportView />
  );

  const renderSettings = () => (
    <P6SettingsView />
  );

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Primavera P6 Integration</h1>
        <p className="text-gray-600">
          Seamlessly sync project data between PMFusion and Oracle Primavera P6
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 rounded-xl p-1">
          {[
            { id: 'overview', label: 'Overview', icon: Components.DashboardIcon },
            { id: 'projects', label: 'P6 Projects', icon: Components.ProjectIcon },
            { id: 'mapping', label: 'Data Mapping', icon: Components.MappingIcon },
            { id: 'export', label: 'Export', icon: Components.ExportIcon },
            { id: 'settings', label: 'Settings', icon: Components.SettingsIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id 
                  ? 'bg-white text-purple-700 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {loading && activeTab !== 'overview' && (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      )}

      {!loading && (
        <>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'projects' && renderProjects()}
          {activeTab === 'mapping' && renderMapping()}
          {activeTab === 'export' && renderExport()}
          {activeTab === 'settings' && renderSettings()}
        </>
      )}
    </div>
  );
};

// P6 Projects View Component
const P6ProjectsView = ({ projects, onLoad, loading }) => {
  const [selectedProject, setSelectedProject] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  useEffect(() => {
    if (projects.length === 0) {
      onLoad();
    }
  }, []);

  const loadActivities = async (projectId) => {
    setLoadingActivities(true);
    try {
      const response = await axios.get(`${API}/p6/projects/${projectId}/activities`);
      setActivities(response.data.activities || []);
    } catch (error) {
      console.error('Error loading activities:', error);
      setActivities([]);
    } finally {
      setLoadingActivities(false);
    }
  };

  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    loadActivities(project.ObjectId);
  };

  const syncProject = async (projectId) => {
    try {
      await axios.post(`${API}/p6/sync`, {
        project_ids: [projectId],
        sync_projects: true,
        sync_activities: true,
        sync_resources: false
      });
      alert('Project synced successfully!');
    } catch (error) {
      console.error('Sync failed:', error);
      alert('Sync failed: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">P6 Projects</h2>
        <button
          onClick={onLoad}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projects List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Available Projects</h3>
          
          {projects.length === 0 ? (
            <div className="text-center py-8">
              <Components.ProjectIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No P6 projects found</p>
              <button
                onClick={onLoad}
                className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                Load Projects
              </button>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {projects.map(project => (
                <div
                  key={project.ObjectId}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedProject?.ObjectId === project.ObjectId
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleProjectSelect(project)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{project.Name}</h4>
                      <p className="text-sm text-gray-600">ID: {project.Id}</p>
                      {project.Status && (
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                          project.Status === 'Active' ? 'bg-green-100 text-green-800' :
                          project.Status === 'Planning' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {project.Status}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        syncProject(project.ObjectId);
                      }}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                    >
                      Sync
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Project Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Project Details</h3>
          
          {selectedProject ? (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">{selectedProject.Name}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Project ID:</span>
                    <p className="font-medium">{selectedProject.Id}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <p className="font-medium">{selectedProject.Status || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Start Date:</span>
                    <p className="font-medium">
                      {selectedProject.StartDate ? new Date(selectedProject.StartDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Finish Date:</span>
                    <p className="font-medium">
                      {selectedProject.FinishDate ? new Date(selectedProject.FinishDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  {selectedProject.ProjectManager && (
                    <div className="col-span-2">
                      <span className="text-gray-600">Project Manager:</span>
                      <p className="font-medium">{selectedProject.ProjectManager}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Activities */}
              <div className="border-t border-gray-200 pt-4">
                <h5 className="font-medium text-gray-900 mb-3">Activities ({activities.length})</h5>
                
                {loadingActivities ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto"></div>
                  </div>
                ) : activities.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {activities.slice(0, 10).map(activity => (
                      <div key={activity.ObjectId} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{activity.Name}</p>
                            <p className="text-xs text-gray-600">ID: {activity.Id}</p>
                          </div>
                          <div className="text-right">
                            {activity.PercentComplete !== undefined && (
                              <div className="text-xs text-gray-600">
                                {activity.PercentComplete}% complete
                              </div>
                            )}
                            {activity.Status && (
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                activity.Status === 'Completed' ? 'bg-green-100 text-green-800' :
                                activity.Status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {activity.Status}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {activities.length > 10 && (
                      <p className="text-sm text-gray-600 text-center py-2">
                        And {activities.length - 10} more activities...
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-600 text-sm">No activities found for this project</p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Components.ProjectIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Select a project to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// P6 Data Mapping View Component
const P6MappingView = () => {
  const [mappingPreview, setMappingPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMappingPreview();
  }, []);

  const loadMappingPreview = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/p6/mapping/preview`);
      setMappingPreview(response.data.mapping_preview);
    } catch (error) {
      console.error('Error loading mapping preview:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Data Mapping Configuration</h2>
        <p className="text-gray-600">
          Configure how P6 data fields map to PMFusion fields during synchronization
        </p>
      </div>

      {mappingPreview && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project Mappings */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Project Field Mappings</h3>
            
            <div className="space-y-3">
              {Object.entries(mappingPreview.project_mappings).map(([p6Field, pmfField]) => (
                <div key={p6Field} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                      P6: {p6Field}
                    </span>
                    <Components.ArrowRightIcon className="h-4 w-4 text-gray-400 mx-3" />
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm font-medium">
                      PMF: {pmfField}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Mappings */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Activity → Task Mappings</h3>
            
            <div className="space-y-3">
              {Object.entries(mappingPreview.activity_mappings).map(([p6Field, pmfField]) => (
                <div key={p6Field} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                      P6: {p6Field}
                    </span>
                    <Components.ArrowRightIcon className="h-4 w-4 text-gray-400 mx-3" />
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm font-medium">
                      PMF: {pmfField}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status Mappings */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Status Mappings</h3>
            
            <div className="space-y-3">
              {Object.entries(mappingPreview.status_mappings).map(([p6Status, pmfStatus]) => (
                <div key={p6Status} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                      {p6Status}
                    </span>
                    <Components.ArrowRightIcon className="h-4 w-4 text-gray-400 mx-3" />
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm font-medium">
                      {pmfStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Priority Mappings */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Priority Mappings</h3>
            
            <div className="space-y-3">
              {Object.entries(mappingPreview.priority_mappings).map(([p6Priority, pmfPriority]) => (
                <div key={p6Priority} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                      {p6Priority}
                    </span>
                    <Components.ArrowRightIcon className="h-4 w-4 text-gray-400 mx-3" />
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm font-medium">
                      {pmfPriority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sample Data Preview */}
      {mappingPreview && (mappingPreview.sample_p6_project || mappingPreview.sample_p6_activity) && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Sample Data Preview</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {mappingPreview.sample_p6_project && (
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Sample P6 Project</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-sm text-gray-800 overflow-x-auto">
                    {JSON.stringify(mappingPreview.sample_p6_project, null, 2)}
                  </pre>
                </div>
              </div>
            )}
            
            {mappingPreview.sample_p6_activity && (
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Sample P6 Activity</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-sm text-gray-800 overflow-x-auto">
                    {JSON.stringify(mappingPreview.sample_p6_activity, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// P6 Export View Component
const P6ExportView = () => {
  const [pmfProjects, setPmfProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [exportOptions, setExportOptions] = useState({
    include_tasks: true,
    include_resources: false,
    create_new_project: true,
    p6_project_id: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPMFProjects();
  }, []);

  const loadPMFProjects = async () => {
    try {
      const response = await axios.get(`${API}/projects`);
      setPmfProjects(response.data);
    } catch (error) {
      console.error('Error loading PMFusion projects:', error);
    }
  };

  const exportToP6 = async () => {
    if (!selectedProject) {
      alert('Please select a project to export');
      return;
    }

    setLoading(true);
    try {
      const exportRequest = {
        project_id: selectedProject,
        ...exportOptions
      };

      const response = await axios.post(`${API}/p6/export`, exportRequest);
      
      if (response.data.status === 'success') {
        alert('Project exported to P6 successfully!');
      } else {
        alert(`Export failed: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert(`Export failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Export to P6</h2>
        <p className="text-gray-600">
          Export PMFusion projects and tasks to Primavera P6
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Export Configuration</h3>
        
        <div className="space-y-6">
          {/* Project Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select PMFusion Project
            </label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Choose a project...</option>
              {pmfProjects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* Export Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Export Options
            </label>
            
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportOptions.include_tasks}
                  onChange={(e) => setExportOptions({
                    ...exportOptions,
                    include_tasks: e.target.checked
                  })}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="ml-2 text-sm text-gray-700">Include Tasks as P6 Activities</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportOptions.include_resources}
                  onChange={(e) => setExportOptions({
                    ...exportOptions,
                    include_resources: e.target.checked
                  })}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="ml-2 text-sm text-gray-700">Include Resource Assignments</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportOptions.create_new_project}
                  onChange={(e) => setExportOptions({
                    ...exportOptions,
                    create_new_project: e.target.checked
                  })}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="ml-2 text-sm text-gray-700">Create New P6 Project</span>
              </label>
            </div>
          </div>

          {/* P6 Project ID for updates */}
          {!exportOptions.create_new_project && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Existing P6 Project ID
              </label>
              <input
                type="text"
                value={exportOptions.p6_project_id}
                onChange={(e) => setExportOptions({
                  ...exportOptions,
                  p6_project_id: e.target.value
                })}
                placeholder="Enter P6 Project ID to update"
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Export Button */}
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={exportToP6}
              disabled={loading || !selectedProject}
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Exporting...' : 'Export to P6'}
            </button>
          </div>
        </div>
      </div>

      {/* Export Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
        <h4 className="font-semibold text-blue-900 mb-3">Export Instructions</h4>
        <div className="space-y-2 text-sm text-blue-800">
          <p>• <strong>Create New Project:</strong> This will create a new project in P6 with the PMFusion project data</p>
          <p>• <strong>Update Existing:</strong> This will update an existing P6 project (requires P6 Project ID)</p>
          <p>• <strong>Include Tasks:</strong> PMFusion tasks will be exported as P6 activities with dependencies</p>
          <p>• <strong>Include Resources:</strong> User assignments will be exported as resource assignments in P6</p>
        </div>
      </div>
    </div>
  );
};

// P6 Settings View Component
const P6SettingsView = () => {
  const [config, setConfig] = useState({
    host: '',
    username: '',
    use_mock: true,
    timeout: 60
  });
  const [loading, setLoading] = useState(false);

  const saveConfiguration = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/p6/connection/configure`, config);
      
      if (response.data.status === 'success') {
        alert('P6 configuration saved successfully!');
      } else {
        alert(`Configuration failed: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Configuration failed:', error);
      alert(`Configuration failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">P6 Connection Settings</h2>
        <p className="text-gray-600">
          Configure connection settings for Primavera P6 integration
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Connection Configuration</h3>
        
        <div className="space-y-6">
          {/* Host */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              P6 Host URL
            </label>
            <input
              type="url"
              value={config.host}
              onChange={(e) => setConfig({...config, host: e.target.value})}
              placeholder="https://your-p6-server.com"
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              value={config.username}
              onChange={(e) => setConfig({...config, username: e.target.value})}
              placeholder="P6 Username"
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Mock Mode */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.use_mock}
                onChange={(e) => setConfig({...config, use_mock: e.target.checked})}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Use Mock Mode (for testing without real P6 connection)
              </span>
            </label>
          </div>

          {/* Timeout */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Request Timeout (seconds)
            </label>
            <input
              type="number"
              value={config.timeout}
              onChange={(e) => setConfig({...config, timeout: parseInt(e.target.value)})}
              min="30"
              max="300"
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={saveConfiguration}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
        <h4 className="font-semibold text-yellow-900 mb-3">Security Notice</h4>
        <div className="space-y-2 text-sm text-yellow-800">
          <p>• Credentials are securely stored and encrypted</p>
          <p>• Use service accounts with minimal required permissions</p>
          <p>• Regularly rotate P6 API credentials</p>
          <p>• Mock mode is recommended for development and testing</p>
        </div>
      </div>
    </div>
  );
};

export default P6Integration;
