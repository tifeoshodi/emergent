import { useEffect, useState } from 'react';
import pmfusionAPI from '../src/lib/api';
import ProjectCreationWizard from '../src/components/ProjectCreationWizard';

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadProjects = async () => {
    try {
      const projectsData = await pmfusionAPI.getProjects();
      setProjects(projectsData);
    } catch (error) {
      console.error('Failed to load projects:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleProjectCreated = (newProject) => {
    setProjects(prev => [...prev, newProject]);
    setShowCreateWizard(false);
    // Reload projects to get the latest data
    loadProjects();
  };

  const handleCancelCreate = () => {
    setShowCreateWizard(false);
  };

  if (showCreateWizard) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ProjectCreationWizard 
          onProjectCreated={handleProjectCreated}
          onCancel={handleCancelCreate}
        />
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
              <h2 className="text-lg font-semibold text-gray-900">PMFusion - Projects</h2>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                Dashboard
              </a>
              <a href="/tasks" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                Tasks
              </a>
              <a href="/kanban" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                Kanban
              </a>
              <a href="/wbs" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                WBS
              </a>
              <a href="/document-control" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                Document Control
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header with Create Button */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage your projects and access project details
              </p>
            </div>
            <button
              onClick={() => setShowCreateWizard(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-colors duration-200"
            >
              + Create New Project
            </button>
          </div>

          {/* Projects List */}
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Your Projects ({projects.length})
              </h3>
            </div>
            
            <div className="divide-y divide-gray-200">
              {loading ? (
                <div className="px-6 py-8 text-center text-gray-500">
                  Loading projects...
                </div>
              ) : projects.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <div className="text-gray-400 mb-2">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No Projects Found</h3>
                  <p className="text-gray-500 mb-4">Get started by creating your first project</p>
                  <button
                    onClick={() => setShowCreateWizard(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-colors duration-200"
                  >
                    Create Your First Project
                  </button>
                </div>
              ) : (
                projects.map((project) => (
                  <div key={project.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-lg font-medium text-gray-900">
                          {project.name}
                        </h4>
                        {project.description && (
                          <p className="mt-1 text-sm text-gray-600">
                            {project.description}
                          </p>
                        )}
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                          {project.code && (
                            <span className="bg-gray-100 px-2 py-1 rounded text-xs font-medium">
                              {project.code}
                            </span>
                          )}
                          {project.client_name && (
                            <span>Client: {project.client_name}</span>
                          )}
                          {project.start_date && (
                            <span>Start: {new Date(project.start_date).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => window.location.href = `/project-details?id=${project.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectsPage;
