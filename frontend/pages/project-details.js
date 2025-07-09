import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import pmfusionAPI from '../src/lib/api';

const ProjectDetailsPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [project, setProject] = useState(null);
  const [wbs, setWbs] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (id) {
      loadProjectDetails();
    }
  }, [id]);

  const loadProjectDetails = async () => {
    try {
      setLoading(true);
      const [projectData, wbsData, tasksData] = await Promise.all([
        pmfusionAPI.getProject(id),
        pmfusionAPI.getProjectWBS(id).catch(() => []), // WBS might not exist yet
        pmfusionAPI.getTasks(id).catch(() => []) // Tasks might not exist yet
      ]);
      setProject(projectData);
      setWbs(wbsData);
      setTasks(tasksData);
    } catch (error) {
      console.error('Failed to load project details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateWBS = async () => {
    try {
      const wbsData = await pmfusionAPI.generateProjectWBS(id);
      setWbs(wbsData);
      
      // Automatically sync tasks from WBS for better integration
      try {
        const syncResult = await pmfusionAPI.syncTasksFromWBS(id);
        console.log('Tasks synced from WBS:', syncResult);
        
        // Refresh tasks to show the newly synced tasks
        const updatedTasks = await pmfusionAPI.getTasks(id);
        setTasks(updatedTasks);
        
        alert('WBS generated successfully and tasks synced!');
      } catch (syncError) {
        console.error('Failed to sync tasks from WBS:', syncError);
        alert('WBS generated successfully, but task sync failed. You can manually sync tasks later.');
      }
    } catch (error) {
      console.error('Failed to generate WBS:', error);
      alert('Failed to generate WBS. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Project not found</h2>
          <p className="text-gray-600 mb-4">The project you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/projects')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/projects')}
                className="text-gray-500 hover:text-gray-700 mr-4"
              >
                ← Back
              </button>
              <h2 className="text-lg font-semibold text-gray-900">
                Project: {project.name}
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                Dashboard
              </a>
              <a href="/projects" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                Projects
              </a>
              <a href="/wbs" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                WBS
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Project Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
              <p className="mt-1 text-gray-600">{project.description}</p>
              <div className="mt-3 flex items-center space-x-4">
                {project.code && (
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {project.code}
                  </span>
                )}
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  project.status === 'active' ? 'bg-green-100 text-green-800' :
                  project.status === 'planning' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {project.status?.charAt(0).toUpperCase() + project.status?.slice(1)}
                </span>
              </div>
            </div>
            <div className="text-right">
              {project.client_name && (
                <p className="text-sm text-gray-600">Client: <span className="font-medium">{project.client_name}</span></p>
              )}
              {project.start_date && (
                <p className="text-sm text-gray-600">
                  Start: <span className="font-medium">{new Date(project.start_date).toLocaleDateString()}</span>
                </p>
              )}
              {project.end_date && (
                <p className="text-sm text-gray-600">
                  End: <span className="font-medium">{new Date(project.end_date).toLocaleDateString()}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {['overview', 'wbs', 'tasks'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Project Information</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{project.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="mt-1 text-sm text-gray-900">{project.description || 'No description provided'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Project Code</dt>
                  <dd className="mt-1 text-sm text-gray-900">{project.code || 'Not specified'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Client</dt>
                  <dd className="mt-1 text-sm text-gray-900">{project.client_name || 'Not specified'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1 text-sm text-gray-900">{project.status || 'Unknown'}</dd>
                </div>
              </dl>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Timeline</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Start Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Not set'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">End Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Not set'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Duration</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {project.start_date && project.end_date 
                      ? `${Math.ceil((new Date(project.end_date) - new Date(project.start_date)) / (1000 * 60 * 60 * 24))} days`
                      : 'Not calculated'
                    }
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {project.created_at ? new Date(project.created_at).toLocaleDateString() : 'Unknown'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        {activeTab === 'wbs' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Work Breakdown Structure</h3>
              <button
                onClick={handleGenerateWBS}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg text-sm"
              >
                Generate WBS
              </button>
            </div>
            <div className="p-6">
              {wbs.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-1">No WBS generated yet</h4>
                  <p className="text-gray-500 mb-4">Generate a Work Breakdown Structure to organize project tasks</p>
                  <button
                    onClick={handleGenerateWBS}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
                  >
                    Generate WBS Now
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {wbs.map((node, index) => (
                    <div key={node.id || index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                        {node.wbs_code}
                      </span>
                      <div>
                        <h4 className="font-medium text-gray-900">{node.title}</h4>
                        {node.duration_days > 0 && (
                          <p className="text-sm text-gray-500">Duration: {node.duration_days} days</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Project Tasks ({tasks.length})</h3>
              <button
                onClick={() => router.push('/tasks')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg text-sm"
              >
                Manage Tasks
              </button>
            </div>
            <div className="p-6">
              {tasks.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-1">No tasks yet</h4>
                  <p className="text-gray-500 mb-4">Generate a WBS or create tasks manually to get started</p>
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => setActiveTab('wbs')}
                      className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg"
                    >
                      Generate WBS First
                    </button>
                    <button
                      onClick={() => router.push('/tasks')}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
                    >
                      Create Tasks
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task, index) => (
                    <div key={task.id || index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          task.status === 'done' ? 'bg-green-500' :
                          task.status === 'in_progress' ? 'bg-blue-500' :
                          task.status === 'review' ? 'bg-yellow-500' :
                          'bg-gray-400'
                        }`}></div>
                        <div>
                          <h4 className="font-medium text-gray-900">{task.title}</h4>
                          <p className="text-sm text-gray-500">{task.description}</p>
                          {task.phase && (
                            <span className="inline-block mt-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                              {task.phase}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          task.status === 'done' ? 'bg-green-100 text-green-800' :
                          task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          task.status === 'review' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {task.status?.replace('_', ' ').toUpperCase() || 'TODO'}
                        </span>
                        {task.duration_days > 0 && (
                          <p className="text-xs text-gray-500 mt-1">{task.duration_days} days</p>
                        )}
                        {task.is_milestone && (
                          <p className="text-xs text-purple-600 mt-1">📍 Milestone</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetailsPage; 