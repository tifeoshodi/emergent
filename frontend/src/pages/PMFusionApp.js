import React, { useState, useEffect } from 'react';
import pmfusionAPI from '../lib/api';
import { supabase } from '../lib/supabaseClient';
import ProjectCreationWizard from './ProjectCreationWizard';
import KanbanBoard from './KanbanBoard';
import DisciplineRegister from './DisciplineRegister';

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

  // Authentication state
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);

  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });
  const [loginError, setLoginError] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    initializeAuth();
  }, []);

  useEffect(() => {
    if (currentUser) {
      initializeApp();
    }
  }, [currentUser]);

  const initializeAuth = async () => {
    try {
      // Get initial session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
      } else if (session?.user) {
        await setUserFromSession(session);
      }

      // Listen for auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth state changed:', event, session?.user?.email);
          
          if (event === 'SIGNED_IN' && session?.user) {
            await setUserFromSession(session);
          } else if (event === 'SIGNED_OUT') {
            setCurrentUser(null);
            setProjects([]);
            setDisciplines([]);
            setSelectedProject(null);
            setSelectedDiscipline(null);
          }
        }
      );

      return () => {
        subscription?.unsubscribe();
      };
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      setAuthLoading(false);
    }
  };

  const setUserFromSession = async (session) => {
    try {
      // Try to get user profile from our users table
      const { data: userProfile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) {
        // Only log if it's not a "no rows" error
        const isNoRowsError = error.code === 'PGRST116' || error.message?.includes('No rows found');
        if (!isNoRowsError) {
          console.error('Error fetching user profile:', error);
        }
      }
      // Set user data combining auth and profile info
      const userData = {
        id: session.user.id,
        email: session.user.email,
        name: userProfile?.full_name || session.user.user_metadata?.full_name || session.user.email,
        role: userProfile?.role || 'team_member',
        discipline_id: userProfile?.discipline_id || null,
        org_id: userProfile?.org_id || null,
        ...userProfile
      };

      setCurrentUser(userData);
    } catch (error) {
      console.error('Error setting user from session:', error);
      // Fallback to basic user data from auth
      setCurrentUser({
        id: session.user.id,
        email: session.user.email,
        name: session.user.email,
        role: 'team_member',
        discipline_id: null,
        org_id: null
      });
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginForm.email,
        password: loginForm.password,
      });

      if (error) {
        setLoginError(error.message);
      } else {
        setShowLogin(false);
        setLoginForm({ email: '', password: '' });
      }
    } catch (error) {
      setLoginError('An unexpected error occurred. Please try again.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoginError(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: loginForm.email,
        password: loginForm.password,
        options: {
          data: {
            full_name: loginForm.email.split('@')[0] // Simple default name
          }
        }
      });

      if (error) {
        setLoginError(error.message);
      } else {
        setLoginError(null);
        alert('Registration successful! Please check your email to confirm your account.');
        setIsRegistering(false);
      }
    } catch (error) {
      setLoginError('An unexpected error occurred. Please try again.');
      console.error('Register error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const LoginForm = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isRegistering ? 'Create your account' : 'Sign in to PMFusion'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Three-Phase Project Management Workflow
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={isRegistering ? handleRegister : handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={loginForm.email}
                onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={loginForm.password}
                onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>
          </div>

          {loginError && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{loginError}</div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Processing...' : (isRegistering ? 'Create Account' : 'Sign In')}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-blue-600 hover:text-blue-500 text-sm"
            >
              {isRegistering ? 'Already have an account? Sign in' : 'Need an account? Register'}
            </button>
          </div>

          <div className="text-center">
          <button
            type="button"
            onClick={() => {
              if (process.env.REACT_APP_ENABLE_DEMO === 'true') {
                setLoginForm({
                  email: process.env.REACT_APP_DEMO_EMAIL || '',
                  password: process.env.REACT_APP_DEMO_PASSWORD || '',
                });
                setLoginError('Demo credentials loaded - click Sign In');
              }
            }}
            className="text-gray-500 hover:text-gray-700 text-xs"
          >
            Load Demo Credentials
          </button>
          </div>
        </form>
      </div>
    </div>
  );

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

  const Navigation = () => {
    const NAV_LABELS = {
      dashboard: 'Dashboard',
      projects: 'Projects',
      disciplines: 'Disciplines',
      kanban: 'Team Workspace',
      documents: 'Document Control'
    };

    const ROLE_VIEWS = {
      admin: ['dashboard', 'projects', 'disciplines', 'kanban', 'documents'],
      scheduler: ['dashboard', 'projects', 'disciplines', 'kanban', 'documents'],
      team_lead: ['dashboard', 'kanban', 'documents'],
      team_member: ['dashboard', 'kanban'],
      dcc: ['dashboard', 'documents'],
      client: ['documents']
    };

    const allowedViews = ROLE_VIEWS[currentUser?.role] || ['dashboard'];

    return (
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
                {allowedViews.map((view) => (
                  <button
                    key={view}
                    onClick={() => setCurrentView(view)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentView === view
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {NAV_LABELS[view]}
                  </button>
                ))}
              </div>
            </div>

            {/* User Info and Actions */}
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                {currentUser?.name} ({currentUser?.role})
              </div>

              {(currentUser?.role === 'scheduler' || currentUser?.role === 'admin') && (
                <button
                  onClick={() => setShowProjectWizard(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Create Project
                </button>
              )}
            
            <button
              onClick={handleLogout}
              className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
  }

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
        {currentUser?.role === 'scheduler' && (
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
            {currentUser?.role === 'scheduler' && (
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

  const DocumentsView = () => {
    const [dccDocs, setDccDocs] = useState([]);
    const [clientDocs, setClientDocs] = useState([]);
    const [approvedDocs, setApprovedDocs] = useState([]);
    const [metrics, setMetrics] = useState(null);
    const [docsLoading, setDocsLoading] = useState(true);

    useEffect(() => {
      fetchAllDocs();
    }, [selectedProject]);

    const fetchAllDocs = async () => {
      setDocsLoading(true);
      try {
        const [dcc, client, approved, summary] = await Promise.all([
          pmfusionAPI.getDocuments({ review_step: 'dcc', project_id: selectedProject?.id }),
          pmfusionAPI.getDocuments({ status: 'under_review', project_id: selectedProject?.id }),
          pmfusionAPI.getDocuments({ status: 'approved', project_id: selectedProject?.id }),
          pmfusionAPI.getDocumentAnalytics(selectedProject?.id)
        ]);

        setDccDocs(dcc || []);
        setClientDocs(client || []);
        setApprovedDocs(approved || []);
        setMetrics(summary || null);
      } catch (err) {
        console.error('Failed loading documents', err);
      } finally {
        setDocsLoading(false);
      }
    };

    const handleSendToClient = async (id) => {
      try {
        await pmfusionAPI.finalizeDocument(id);
        fetchAllDocs();
      } catch (err) {
        console.error('Finalize failed', err);
      }
    };

    const handleApprove = async (id) => {
      try {
        await pmfusionAPI.updateDocumentStatus(id, { status: 'approved', approved_by: currentUser.id });
        fetchAllDocs();
      } catch (err) {
        console.error('Approval failed', err);
      }
    };

    const handleReject = async (id) => {
      try {
        await pmfusionAPI.updateDocumentStatus(id, { status: 'draft', reviewed_by: currentUser.id });
        fetchAllDocs();
      } catch (err) {
        console.error('Rejection failed', err);
      }
    };

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Document Control Centre</h2>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 mb-4">Phase 3: Document Control workflow management</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-purple-600">DCC Queue</h4>
              <p className="text-sm text-gray-600">Documents awaiting review</p>
              <div className="mt-2 text-2xl font-bold text-purple-600">{dccDocs.length}</div>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-orange-600">Client Review</h4>
              <p className="text-sm text-gray-600">External approval process</p>
              <div className="mt-2 text-2xl font-bold text-orange-600">{clientDocs.length}</div>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-green-600">Approved</h4>
              <p className="text-sm text-gray-600">Completed documents</p>
              <div className="mt-2 text-2xl font-bold text-green-600">{approvedDocs.length}</div>
            </div>
          </div>

          {/* Document Lists */}
          {docsLoading ? (
            <div className="text-gray-500">Loading documents...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">DCC Queue</h3>
                <div className="space-y-2">
                  {dccDocs.map(doc => (
                    <div key={doc.id} className="flex justify-between items-center p-2 border rounded">
                      <span className="text-sm">{doc.title}</span>
                      <button onClick={() => handleSendToClient(doc.id)} className="text-blue-600 text-sm">Send</button>
                    </div>
                  ))}
                  {dccDocs.length === 0 && <p className="text-sm text-gray-500">No documents</p>}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Client Review</h3>
                <div className="space-y-2">
                  {clientDocs.map(doc => (
                    <div key={doc.id} className="flex justify-between items-center p-2 border rounded">
                      <span className="text-sm">{doc.title}</span>
                      <div className="space-x-2">
                        <button onClick={() => handleApprove(doc.id)} className="text-green-600 text-sm">Approve</button>
                        <button onClick={() => handleReject(doc.id)} className="text-red-600 text-sm">Reject</button>
                      </div>
                    </div>
                  ))}
                  {clientDocs.length === 0 && <p className="text-sm text-gray-500">No documents</p>}
                </div>
              </div>
            </div>
          )}

          {metrics && metrics.by_status && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {Object.entries(metrics.by_status).map(([status, info]) => (
                <div key={status} className="text-center p-4 border rounded">
                  <div className="text-2xl font-bold">{info.count}</div>
                  <div className="text-sm text-gray-600 capitalize">{status.replace('_', ' ')}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!currentUser) {
    return <LoginForm />;
  }

  // Show loading for app data
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

  // Show main authenticated app
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
        {currentView === 'disciplines' && <DisciplineRegister />}
        {currentView === 'kanban' && <KanbanView />}
        {currentView === 'documents' && <DocumentsView />}
      </div>
    </div>
  );
};

export default PMFusionApp;