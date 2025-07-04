import React, { useState, useEffect, createContext, useContext } from "react";
import "../styles/App.css";
import { Routes, Route, Link, useNavigate, Navigate } from "react-router-dom";
import axios from "axios";
import { supabase } from "../lib/supabaseClient";

// Set user ID after authentication
// axios.defaults.headers.common["X-User-ID"] = authenticatedUserId;

import Components from "../components/Components";
import WBSGenerator from "../components/WBSGenerator";

// Import PMFusion Three-Phase Workflow Components
import PMFusionApp from "../components/PMFusionApp";

import Components from "./Components";
import Dashboard from "./pages/Dashboard";
import UserManagement from "./pages/UserManagement";
import TaskManagement from "./pages/TaskManagement";
import ProjectManagement from "./pages/ProjectManagement";
import DocumentControlCenter from "./pages/DocumentControlCenter";
import WBSGenerator from "./pages/WBSGenerator";

// Import PMFusion Three-Phase Workflow Components
import PMFusionApp from "./pages/PMFusionApp";




const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const API = `${BACKEND_URL}/api`;

// Authentication context to store the currently logged in user
export const AuthContext = createContext({ currentUser: null });

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);

  const login = async (id) => {
    if (supabase && process.env.REACT_APP_SUPABASE_URL) {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      axios.defaults.headers.common["X-User-ID"] = data.id;
      setCurrentUser(data);
    } else {
      const res = await axios.get(`${API}/users/${id}`);
      axios.defaults.headers.common["X-User-ID"] = res.data.id;
      setCurrentUser(res.data);
    }
  };

  const logout = () => {
    delete axios.defaults.headers.common["X-User-ID"];
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Simple login page allowing user ID entry
const LoginPage = () => {
  const [userId, setUserId] = useState("");
  const [error, setError] = useState(null);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await login(userId);
      navigate("/");
    } catch (err) {
      setError("Login failed");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow w-72">
        <h2 className="mb-4 text-lg font-semibold text-center">Login</h2>
        <input
          className="border p-2 w-full mb-3"
          placeholder="User ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded"
        >
          Login
        </button>
      </form>
    </div>
  );
};

// Maximum number of retries for API calls
const MAX_RETRIES = 3;

// Home Page Component
const HomePage = () => {
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connecting', 'connected', 'error'
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      // First, check if the API is available
      const healthCheck = await axios.get(`${API}/`);
      if (healthCheck.status === 200) {
        // API is available, now fetch the data
        const [statsRes, tasksRes, projectsRes] = await Promise.all([
          axios.get(`${API}/dashboard/stats`),
          axios.get(`${API}/tasks`),
          axios.get(`${API}/projects`)
        ]);
        
        setStats(statsRes.data);
        setConnectionStatus('connected');
        // Reset retry count on successful connection
        setRetryCount(0);
        
        // Combine recent activity from tasks and projects
        const activity = [
          ...tasksRes.data.slice(0, 3).map(task => ({
            type: 'task',
            title: task.title,
            status: task.status,
            created_at: task.created_at
          })),
          ...projectsRes.data.slice(0, 3).map(project => ({
            type: 'project', 
            title: project.name,
            status: project.status,
            created_at: project.created_at
          }))
        ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
        
        setRecentActivity(activity);
      }
    } catch (error) {
      console.error('Error fetching home data:', error);
      setConnectionStatus('error');
      
      // Check if we've reached the maximum number of retries
      if (retryCount < MAX_RETRIES) {
        // Try to fetch data individually if the bulk fetch failed
        try {
          const statsRes = await axios.get(`${API}/dashboard/stats`);
          setStats(statsRes.data);
          setConnectionStatus('connected');
          // Reset retry count on successful connection
          setRetryCount(0);
        } catch (statsError) {
          console.error('Stats API still failing:', statsError);
          setConnectionStatus('error');
          // Increment retry count
          setRetryCount(prevCount => prevCount + 1);
          // Only show fallback demo data if individual API calls also fail
          setStats({
            total_projects: 0,
            active_projects: 0,
            total_tasks: 0,
            completed_tasks: 0,
            in_progress_tasks: 0,
            overdue_tasks: 0,
            my_tasks: 0
          });
        }
        
        // Try to get real project data for recent activity
        try {
          const projectsRes = await axios.get(`${API}/projects`);
          const activity = projectsRes.data.slice(0, 5).map(project => ({
            type: 'project', 
            title: project.name,
            status: project.status,
            created_at: project.created_at
          }));
          setRecentActivity(activity);
        } catch (activityError) {
          console.error('Projects API failing:', activityError);
          setRecentActivity([]);
        }
      } else {
        console.warn(`Maximum retry attempts (${MAX_RETRIES}) reached. Giving up.`);
        // Set fallback data after max retries
        setStats({
          total_projects: 0,
          active_projects: 0,
          total_tasks: 0,
          completed_tasks: 0,
          in_progress_tasks: 0,
          overdue_tasks: 0,
          my_tasks: 0
        });
        setRecentActivity([]);
      }
    }
  };

  if (!stats) return <div className="flex justify-center items-center h-64">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-6">
              PMFusion
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              The ultimate project management platform that fuses the power of Primavera P6 scheduling 
              with Jira's agile workflows, designed specifically for EPC teams in oil & gas engineering.
            </p>
            <div className="flex justify-center gap-4">
              <Link 
                to="/dashboard" 
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-xl font-semibold transition-colors text-lg"
              >
                Open Dashboard
              </Link>
              <Link 
                to="/projects" 
                className="bg-white hover:bg-gray-50 text-purple-600 border-2 border-purple-600 px-8 py-4 rounded-xl font-semibold transition-colors text-lg"
              >
                Manage Projects
              </Link>
              <Link 
                to="/users" 
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-semibold transition-colors text-lg"
              >
                Manage Team
              </Link>
              <Link 
                to="/documents" 
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl font-semibold transition-colors text-lg"
              >
                Documents
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mr-4">Platform Overview</h2>
          <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            connectionStatus === 'connected' 
              ? 'bg-green-100 text-green-800' 
              : connectionStatus === 'error'
              ? 'bg-red-100 text-red-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${
              connectionStatus === 'connected' 
                ? 'bg-green-400' 
                : connectionStatus === 'error'
                ? 'bg-red-400'
                : 'bg-yellow-400'
            }`}></div>
            {connectionStatus === 'connected' && 'Live Database Data'}
            {connectionStatus === 'error' && 'Database Connection Error'}
            {connectionStatus === 'connecting' && 'Connecting to Database...'}
          </div>
          {connectionStatus === 'error' && (
            <button 
              onClick={fetchHomeData}
              className="ml-3 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
            >
              Retry Connection
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="stats-card stats-card-total">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">Total Projects</p>
                  <p className="text-3xl font-bold text-white">{stats.total_projects}</p>
                </div>
                <Components.ProjectIcon className="h-8 w-8 text-white/60" />
              </div>
            </div>
          </div>

          <div className="stats-card stats-card-active">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">Active Projects</p>
                  <p className="text-3xl font-bold text-white">{stats.active_projects}</p>
                </div>
                <Components.ActiveIcon className="h-8 w-8 text-white/60" />
              </div>
            </div>
          </div>

          <div className="stats-card stats-card-tasks">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">Total Tasks</p>
                  <p className="text-3xl font-bold text-white">{stats.total_tasks}</p>
                </div>
                <Components.TaskIcon className="h-8 w-8 text-white/60" />
              </div>
            </div>
          </div>

          <div className="stats-card stats-card-completed">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">Completed Tasks</p>
                  <p className="text-3xl font-bold text-white">{stats.completed_tasks}</p>
                </div>
                <Components.CompleteIcon className="h-8 w-8 text-white/60" />
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h3>
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No recent activity</p>
              ) : (
                recentActivity.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center">
                      {item.type === 'project' ? (
                        <Components.ProjectIcon className="h-5 w-5 text-purple-600 mr-3" />
                      ) : (
                        <Components.TaskIcon className="h-5 w-5 text-blue-600 mr-3" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{item.title}</p>
                        <p className="text-sm text-gray-600 capitalize">
                          {item.type} • {item.status.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Key Features */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Key Features</h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <Components.ChartIcon className="h-6 w-6 text-purple-600 mr-3 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">Gantt Chart Scheduling</h4>
                  <p className="text-sm text-gray-600">Visual project timelines with critical path analysis</p>
                </div>
              </div>
              <div className="flex items-start">
                <Components.TaskIcon className="h-6 w-6 text-blue-600 mr-3 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">Agile Kanban Boards</h4>
                  <p className="text-sm text-gray-600">Flexible task management with drag-and-drop workflow</p>
                </div>
              </div>
              <div className="flex items-start">
                <Components.ResourceIcon className="h-6 w-6 text-green-600 mr-3 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">Resource Management</h4>
                  <p className="text-sm text-gray-600">Track engineer allocation and utilization across projects</p>
                </div>
              </div>
              <div className="flex items-start">
                <Components.UserIcon className="h-6 w-6 text-orange-600 mr-3 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">EPC Team Structure</h4>
                  <p className="text-sm text-gray-600">Built for engineering hierarchies and disciplines</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


// Project Management Component with Gantt and Resource Views
// Document Management Component
const DocumentManagementPage = () => {
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    discipline: '',
    search: ''
  });
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    category: '',
    discipline: '',
    document_number: '',
    is_confidential: false,
    tags: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // EPC Document Categories
  const documentCategories = [
    { value: 'engineering_drawing', label: 'Engineering Drawing' },
    { value: 'piping_drawing', label: 'P&ID Drawing' },
    { value: 'electrical_drawing', label: 'Electrical Drawing' },
    { value: 'instrument_drawing', label: 'Instrument Drawing' },
    { value: 'technical_specification', label: 'Technical Specification' },
    { value: 'project_report', label: 'Project Report' },
    { value: 'safety_document', label: 'Safety Document' },
    { value: 'compliance_document', label: 'Compliance Document' },
    { value: 'meeting_minutes', label: 'Meeting Minutes' },
    { value: 'vendor_document', label: 'Vendor Document' },
    { value: 'as_built_document', label: 'As-Built Document' },
    { value: 'procedure', label: 'Procedure' },
    { value: 'manual', label: 'Manual' },
    { value: 'certificate', label: 'Certificate' },
    { value: 'other', label: 'Other' }
  ];

  const documentStatuses = [
    { value: 'draft', label: 'Draft' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'superseded', label: 'Superseded' },
    { value: 'archived', label: 'Archived' }
  ];

  const disciplines = [
    'Mechanical Engineering',
    'Electrical Engineering',
    'Process Engineering',
    'Civil Engineering',
    'Instrumentation & Control',
    'Piping Engineering',
    'Safety Engineering',
    'Environmental Engineering'
  ];

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [documents, filters]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/documents`);
      setDocuments(response.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...documents];

    if (filters.category) {
      filtered = filtered.filter(doc => doc.category === filters.category);
    }
    if (filters.status) {
      filtered = filtered.filter(doc => doc.status === filters.status);
    }
    if (filters.discipline) {
      filtered = filtered.filter(doc => doc.discipline === filters.discipline);
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(searchLower) ||
        doc.description.toLowerCase().includes(searchLower) ||
        (doc.document_number && doc.document_number.toLowerCase().includes(searchLower)) ||
        doc.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    setFilteredDocuments(filtered);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    if (file && !uploadData.title) {
      // Auto-populate title from filename
      const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, "");
      setUploadData(prev => ({ ...prev, title: nameWithoutExtension }));
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please select a file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', uploadData.title);
    formData.append('description', uploadData.description);
    formData.append('category', uploadData.category);
    if (uploadData.discipline) formData.append('discipline', uploadData.discipline);
    if (uploadData.document_number) formData.append('document_number', uploadData.document_number);
    formData.append('is_confidential', uploadData.is_confidential);
    formData.append('tags', uploadData.tags);

    try {
      setUploadProgress(10);
      const response = await axios.post(`${API}/documents/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });

      if (response.status === 200) {
        setShowUploadModal(false);
        setUploadData({
          title: '', description: '', category: '', discipline: '', 
          document_number: '', is_confidential: false, tags: ''
        });
        setSelectedFile(null);
        setUploadProgress(0);
        fetchDocuments();
        alert('Document uploaded successfully!');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      alert(`Upload failed: ${error.response?.data?.detail || 'Please try again'}`);
      setUploadProgress(0);
    }
  };

  const handleDownload = async (documentId, fileName) => {
    try {
      const response = await axios.get(`${API}/documents/${documentId}/download`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Download failed. Please try again.');
    }
  };

  const handleStatusUpdate = async (documentId, newStatus) => {
    try {
      await axios.put(`${API}/documents/${documentId}/status`, { status: newStatus });
      fetchDocuments();
      alert(`Document status updated to ${newStatus.replace('_', ' ')}`);
    } catch (error) {
      console.error('Error updating document status:', error);
      alert('Status update failed. Please try again.');
    }
  };

  const handleDelete = async (documentId) => {
    if (window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      try {
        await axios.delete(`${API}/documents/${documentId}`);
        fetchDocuments();
        alert('Document deleted successfully');
      } catch (error) {
        console.error('Error deleting document:', error);
        alert('Delete failed. Please try again.');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'superseded': return 'bg-orange-100 text-orange-800';
      case 'archived': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'engineering_drawing':
      case 'piping_drawing':
      case 'electrical_drawing':
      case 'instrument_drawing':
        return 'bg-purple-100 text-purple-800';
      case 'safety_document': return 'bg-red-100 text-red-800';
      case 'compliance_document': return 'bg-indigo-100 text-indigo-800';
      case 'technical_specification': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCategoryLabel = (categoryValue) => {
    const category = documentCategories.find(c => c.value === categoryValue);
    return category ? category.label : categoryValue.replace('_', ' ').toUpperCase();
  };

  const getStatusLabel = (statusValue) => {
    const status = documentStatuses.find(s => s.value === statusValue);
    return status ? status.label : statusValue.replace('_', ' ').toUpperCase();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Document Management</h1>
          <p className="text-gray-600">Manage engineering documents, drawings, and compliance files</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
        >
          <Components.UploadIcon className="h-5 w-5 inline mr-2" />
          Upload Document
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <div className="relative">
            <Components.SearchIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <select
            value={filters.category}
            onChange={(e) => setFilters({...filters, category: e.target.value})}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {documentCategories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            {documentStatuses.map(status => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>

          <select
            value={filters.discipline}
            onChange={(e) => setFilters({...filters, discipline: e.target.value})}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">All Disciplines</option>
            {disciplines.map(discipline => (
              <option key={discipline} value={discipline}>{discipline}</option>
            ))}
          </select>

          <button
            onClick={() => setFilters({ category: '', status: '', discipline: '', search: '' })}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading documents...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map(document => (
            <div key={document.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <Components.DocumentIcon className="h-8 w-8 text-purple-600 flex-shrink-0" />
                <div className="flex gap-2">
                  {document.is_confidential && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                      Confidential
                    </span>
                  )}
                  <button
                    onClick={() => handleDelete(document.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete Document"
                  >
                    <Components.DeleteIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{document.title}</h3>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{document.description}</p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(document.category)}`}>
                    {getCategoryLabel(document.category)}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(document.status)}`}>
                    {getStatusLabel(document.status)}
                  </span>
                </div>

                {document.discipline && (
                  <div className="text-sm text-gray-600">
                    <strong>Discipline:</strong> {document.discipline}
                  </div>
                )}

                {document.document_number && (
                  <div className="text-sm text-gray-600">
                    <strong>Doc #:</strong> {document.document_number}
                  </div>
                )}

                <div className="text-sm text-gray-600">
                  <strong>Size:</strong> {formatFileSize(document.file_size)} • <strong>Version:</strong> {document.version}
                </div>

                {document.tags && document.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {document.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-xs rounded">
                        {tag}
                      </span>
                    ))}
                    {document.tags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-xs rounded">
                        +{document.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => handleDownload(document.id, document.file_name)}
                  className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                >
                  <Components.DownloadIcon className="h-4 w-4 inline mr-1" />
                  Download
                </button>

                {document.status !== 'approved' && (
                  <button
                    onClick={() => handleStatusUpdate(document.id, 'approved')}
                    className="bg-green-100 hover:bg-green-200 text-green-700 py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                    title="Approve Document"
                  >
                    <Components.ApprovalIcon className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Status Actions */}
              {document.status === 'draft' && (
                <div className="flex gap-1">
                  <button
                    onClick={() => handleStatusUpdate(document.id, 'under_review')}
                    className="flex-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 py-1 px-2 rounded text-xs transition-colors"
                  >
                    Submit for Review
                  </button>
                </div>
              )}

              {document.status === 'under_review' && (
                <div className="flex gap-1">
                  <button
                    onClick={() => handleStatusUpdate(document.id, 'draft')}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-2 rounded text-xs transition-colors"
                  >
                    Return to Draft
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(document.id, 'approved')}
                    className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 py-1 px-2 rounded text-xs transition-colors"
                  >
                    Approve
                  </button>
                </div>
              )}

              <div className="mt-3 text-xs text-gray-500">
                Created: {new Date(document.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredDocuments.length === 0 && !loading && (
        <div className="text-center py-12">
          <Components.DocumentIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {documents.length === 0 ? "No Documents Yet" : "No Documents Found"}
          </h3>
          <p className="text-gray-600 mb-4">
            {documents.length === 0 ? "Upload your first engineering document to get started" : "Try adjusting your filters"}
          </p>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Upload Document</h3>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Document Title"
                  value={uploadData.title}
                  onChange={(e) => setUploadData({...uploadData, title: e.target.value})}
                  className="col-span-2 w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />

                <textarea
                  placeholder="Description"
                  value={uploadData.description}
                  onChange={(e) => setUploadData({...uploadData, description: e.target.value})}
                  className="col-span-2 w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent h-24"
                  required
                />

                <select
                  value={uploadData.category}
                  onChange={(e) => setUploadData({...uploadData, category: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Category</option>
                  {documentCategories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>

                <select
                  value={uploadData.discipline}
                  onChange={(e) => setUploadData({...uploadData, discipline: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select Discipline (Optional)</option>
                  {disciplines.map(discipline => (
                    <option key={discipline} value={discipline}>{discipline}</option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Document Number (Optional)"
                  value={uploadData.document_number}
                  onChange={(e) => setUploadData({...uploadData, document_number: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />

                <input
                  type="text"
                  placeholder="Tags (comma-separated)"
                  value={uploadData.tags}
                  onChange={(e) => setUploadData({...uploadData, tags: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />

                <div className="col-span-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={uploadData.is_confidential}
                      onChange={(e) => setUploadData({...uploadData, is_confidential: e.target.checked})}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Mark as Confidential</span>
                  </label>
                </div>

                <div className="col-span-2">
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.dwg,.jpg,.png,.txt"
                    required
                  />
                  {selectedFile && (
                    <p className="text-sm text-gray-600 mt-2">
                      Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                    </p>
                  )}
                </div>

                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="col-span-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Uploading... {uploadProgress}%</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={uploadProgress > 0 && uploadProgress < 100}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white py-3 rounded-xl font-medium transition-colors"
                >
                  {uploadProgress > 0 && uploadProgress < 100 ? 'Uploading...' : 'Upload Document'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadProgress(0);
                    setSelectedFile(null);
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Document Control Center View
const Navigation = ({ currentPage }) => {
  const { currentUser } = useContext(AuthContext);
  
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center">
                <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  PMFusion
                </h2>
                <span className="ml-2 text-xs text-gray-500 bg-purple-100 px-2 py-1 rounded-full">EPC</span>
              </Link>
            </div>
            <div className="ml-10 flex items-baseline space-x-4">
              <Link
                to="/dashboard"
                className={`nav-item ${currentPage === 'dashboard' ? 'nav-item-active' : 'nav-item-inactive'}`}
              >
                <Components.ChartIcon className="h-4 w-4 inline mr-1" />
                Dashboard
              </Link>
              <Link
                to="/tasks"
                className={`nav-item ${currentPage === 'tasks' ? 'nav-item-active' : 'nav-item-inactive'}`}
              >
                <Components.TaskIcon className="h-4 w-4 inline mr-1" />
                Tasks
              </Link>
              <Link
                to="/projects"
                className={`nav-item ${currentPage === 'projects' ? 'nav-item-active' : 'nav-item-inactive'}`}
              >
                <Components.ProjectIcon className="h-4 w-4 inline mr-1" />
                Projects
              </Link>
              <Link
                to="/users"
                className={`nav-item ${currentPage === 'users' ? 'nav-item-active' : 'nav-item-inactive'}`}
              >
                <Components.UserIcon className="h-4 w-4 inline mr-1" />
                Team
              </Link>
              <Link
                to="/documents"
                className={`nav-item ${currentPage === 'documents' ? 'nav-item-active' : 'nav-item-inactive'}`}
              >
                <Components.DocumentIcon className="h-4 w-4 inline mr-1" />
                Documents
              </Link>
              {currentUser && currentUser.role === 'scheduler' && (
                <Link
                  to="/wbs"
                  className={`nav-item ${currentPage === 'wbs' ? 'nav-item-active' : 'nav-item-inactive'}`}
                >
                  <Components.ChartIcon className="h-4 w-4 inline mr-1" />
                  WBS Generator
                </Link>
              )}
              <Link
                to="/dcc"
                className={`nav-item ${currentPage === 'dcc' ? 'nav-item-active' : 'nav-item-inactive'}`}
              >
                <Components.DocumentIcon className="h-4 w-4 inline mr-1" />
                Control Center
              </Link>
              <Link
                to="/pmfusion"
                className={`nav-item ${currentPage === 'pmfusion' ? 'nav-item-active' : 'nav-item-inactive'}`}
              >
                <Components.ChartIcon className="h-4 w-4 inline mr-1" />
                PMFusion Workflow
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <Link
              to="/"
              className="text-gray-500 hover:text-gray-700 text-sm font-medium"
            >
              <Components.UserIcon className="h-4 w-4 inline mr-1" />
              Home
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

function App() {
  const { currentUser } = useContext(AuthContext);

  if (!currentUser) {
    return <LoginPage />;
  }

  return (
    <div className="App min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={
          <>
            <Navigation currentPage="dashboard" />
            <main><Dashboard /></main>
          </>
        } />
        <Route path="/tasks" element={
          <>
            <Navigation currentPage="tasks" />
            <main><TaskManagement /></main>
          </>
        } />
        <Route path="/projects" element={
          <>
            <Navigation currentPage="projects" />
            <main><ProjectManagement /></main>
          </>
        } />
        <Route path="/users" element={
          <>
            <Navigation currentPage="users" />
            <main><UserManagement /></main>
          </>
        } />
        <Route path="/documents" element={
          <>
            <Navigation currentPage="documents" />
            <main><DocumentManagementPage /></main>
          </>
        } />
        <Route path="/dcc" element={
          <>
            <Navigation currentPage="dcc" />
            <main><DocumentControlCenter /></main>
          </>
        } />
        <Route path="/wbs" element={
          <>
            <Navigation currentPage="wbs" />
            <main><WBSGenerator /></main>
          </>
        } />
        <Route path="/pmfusion" element={
          <>
            <Navigation currentPage="pmfusion" />
            <main><PMFusionApp /></main>
          </>
        } />
      </Routes>
    </div>
  );
}

export default App;
