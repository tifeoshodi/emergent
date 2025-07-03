import React, { useState, useEffect } from 'react';
import pmfusionAPI from './lib/api';
import ProjectCreationWizard from './ProjectCreationWizard';
import KanbanBoard from './KanbanBoard';

const PMFusionApp = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [projects, setProjects] = useState([]);
  const [disciplines, setDisciplines] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedDiscipline, setSelectedDiscipline] = useState(null);
  const [showProjectWizard, setShowProjectWizard] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState('checking');
  const [error, setError] = useState(null);

  // Mock current user - in production this would come from authentication
  const [currentUser] = useState({
    id: 'demo-user-id',
    name: 'Demo User',
    role: 'scheduler',
    discipline_id: null,
    email: 'demo@petromax.com'
  });

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    setError(null);
    try {
      // Check API health first
      try {
        await pmfusionAPI.healthCheck();
        setApiStatus('connected');
        
        // Try to fetch real data
        const projectsResponse = await pmfusionAPI.getProjects();
        const disciplinesResponse = await pmfusionAPI.getDisciplines();
        
        if (projectsResponse?.projects?.length > 0) {
          setProjects(projectsResponse.projects);
          setSelectedProject(projectsResponse.projects[0]);
        } else {
          // Fall back to mock data if no projects found
          loadMockData();
        }
        
        if (disciplinesResponse?.disciplines?.length > 0) {
          setDisciplines(disciplinesResponse.disciplines);
          setSelectedDiscipline(disciplinesResponse.disciplines[0]);
        }
        
      } catch (apiError) {
        console.error("API not available, using demo mode:", apiError);
        setApiStatus('demo');
        loadMockData();
      }
    } catch (error) {
      console.error('Failed to initialize app:', error);
      setApiStatus('error');
      setError('Failed to initialize application. Please check your connection.');
      loadMockData();
    } finally {
      setLoading(false);
    }
  };
  
  const loadMockData = () => {
    // Mock projects data
    const mockProjects = [
      {
        id: '1',
        name: 'Catalytic Cracker Unit Revamp',
        code: 'CCU-2024-REV',
        description: 'Major revamp of the catalytic cracking unit to increase capacity',
        client_name: 'Global Refinery Corp',
        status: 'active'
      }
    ];
    
    // Mock disciplines data
    const mockDisciplines = [
      { id: '1', name: 'Process Engineering', code: 'PRO', color: '#ef4444' },
      { id: '2', name: 'Civil Engineering', code: 'CIV', color: '#3b82f6' },
      { id: '3', name: 'Electrical Engineering', code: 'ELE', color: '#f59e0b' }
    ];
    
    setProjects(mockProjects);
    setDisciplines(mockDisciplines);
    setSelectedProject(mockProjects[0]);
    setSelectedDiscipline(mockDisciplines[0]);
  };

  const handleProjectCreated = (newProject) => {
    setProjects(prev => [...prev, newProject]);
    setSelectedProject(newProject);
    setShowProjectWizard(false);
    setCurrentView('dashboard');
  };

  const Navigation = () => (
    <nav className="bg-white shadow-lg border-b mb-6">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-blue-600">PMFusion</h1>
              <p className="text-xs text-gray-500">Three-Phase Workflow</p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'dashboard'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setCurrentView('projects')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'projects'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                Projects
              </button>
              <button
                onClick={() => setCurrentView('kanban')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'kanban'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                Team Workspace
              </button>
              <button
                onClick={() => setCurrentView('documents')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'documents'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                Document Control
              </button>
            </div>
          </div>

          {/* User Info and Actions */}
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-700">
              {currentUser.name} ({currentUser.role})
            </div>
            
            {currentUser.role === 'scheduler' && (
              <button
                onClick={() => setShowProjectWizard(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Create Project
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );

  const DashboardView = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900">Total Projects</h3>
          <p className="text-3xl font-bold text-blue-600">{projects.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900">Active Disciplines</h3>
          <p className="text-3xl font-bold text-green-600">{disciplines.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
          <p className="text-3xl font-bold text-purple-600">Demo</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900">Workflow Phase</h3>
          <p className="text-lg font-bold text-purple-600">Three-Phase</p>
        </div>
      </div>

      {/* Three-Phase Workflow Overview */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Three-Phase Project Management Workflow</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 border rounded-lg">
            <h4 className="text-lg font-semibold text-blue-600 mb-2">Phase 1: Project Creation</h4>
            <p className="text-sm text-gray-600 mb-3">
              Scheduler role creates projects using CTR/MDR documents with WBS generation and CPM analysis.
            </p>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• 4-step project wizard</li>
              <li>• Document intake (Manual/OCR)</li>
              <li>• WBS generation</li>
              <li>• Dashboard configuration</li>
            </ul>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h4 className="text-lg font-semibold text-green-600 mb-2">Phase 2: Teams Execution</h4>
            <p className="text-sm text-gray-600 mb-3">
              Discipline-based kanban boards with task assignment and status tracking through review stages.
            </p>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• Kanban task boards</li>
              <li>• Team lead assignment</li>
              <li>• DIC → IDC → DCC workflow</li>
              <li>• Real-time collaboration</li>
            </ul>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h4 className="text-lg font-semibold text-purple-600 mb-2">Phase 3: Document Control</h4>
            <p className="text-sm text-gray-600 mb-3">
              DCC officers manage client communication, approvals, and document lifecycle.
            </p>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• Document review queues</li>
              <li>• Client approval workflow</li>
              <li>• Version control</li>
              <li>• Compliance tracking</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      {projects.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Active Projects</h3>
          <div className="space-y-3">
            {projects.map(project => (
              <div key={project.id} className="flex justify-between items-center p-3 border rounded">
                <div>
                  <h4 className="font-medium text-gray-900">{project.name}</h4>
                  <p className="text-sm text-gray-600">{project.code || 'No code'}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  project.status === 'active' ? 'bg-green-100 text-green-800' : 
                  project.status === 'planning' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {project.status || 'Unknown'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const ProjectsView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
        {currentUser.role === 'scheduler' && (
          <button
            onClick={() => setShowProjectWizard(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Create New Project
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(project => (
          <div key={project.id} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.name}</h3>
            <p className="text-sm text-gray-600 mb-3">{project.description || 'No description'}</p>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">{project.code || 'No code'}</span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                project.status === 'active' ? 'bg-green-100 text-green-800' : 
                project.status === 'planning' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {project.status || 'Unknown'}
              </span>
            </div>
            <button
              onClick={() => {
                setSelectedProject(project);
                setCurrentView('kanban');
              }}
              className="mt-3 w-full bg-blue-100 text-blue-700 py-2 rounded hover:bg-blue-200"
            >
              View Workspace
            </button>
          </div>
        ))}
        
        {projects.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">No projects found</p>
            {currentUser.role === 'scheduler' && (
              <button
                onClick={() => setShowProjectWizard(true)}
                className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
              >
                Create Your First Project
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const KanbanView = () => {
    if (!selectedProject || !selectedDiscipline) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Select a project and discipline to view the kanban board</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Project and Discipline Selector */}
        <div className="bg-white p-4 rounded-lg shadow flex gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
            <select
              value={selectedProject?.id || ''}
              onChange={(e) => {
                const project = projects.find(p => p.id === e.target.value);
                setSelectedProject(project);
              }}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Discipline</label>
            <select
              value={selectedDiscipline?.id || ''}
              onChange={(e) => {
                const discipline = disciplines.find(d => d.id === e.target.value);
                setSelectedDiscipline(discipline);
              }}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              {disciplines.map(discipline => (
                <option key={discipline.id} value={discipline.id}>
                  {discipline.name} ({discipline.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Kanban Board */}
        <KanbanBoard
          disciplineId={selectedDiscipline.id}
          projectId={selectedProject.id}
          currentUser={currentUser}
        />
      </div>
    );
  };

  const DocumentsView = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Document Control Centre</h2>
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-600 mb-4">Phase 3: Document Control workflow management</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold text-purple-600">DCC Queue</h4>
            <p className="text-sm text-gray-600">Documents awaiting review</p>
            <div className="mt-2 text-2xl font-bold text-purple-600">3</div>
          </div>
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold text-orange-600">Client Review</h4>
            <p className="text-sm text-gray-600">External approval process</p>
            <div className="mt-2 text-2xl font-bold text-orange-600">1</div>
          </div>
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold text-green-600">Approved</h4>
            <p className="text-sm text-gray-600">Completed documents</p>
            <div className="mt-2 text-2xl font-bold text-green-600">8</div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading PMFusion...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto py-6 px-4">
        {showProjectWizard && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-screen overflow-y-auto">
              <ProjectCreationWizard
                onProjectCreated={handleProjectCreated}
                onCancel={() => setShowProjectWizard(false)}
              />
            </div>
          </div>
        )}
        
        {currentView === 'dashboard' && <DashboardView />}
        {currentView === 'projects' && <ProjectsView />}
        {currentView === 'kanban' && <KanbanView />}
        {currentView === 'documents' && <DocumentsView />}
      </div>
    </div>
  );
};

export default PMFusionApp; 