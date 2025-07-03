// PMFusion Three-Phase Workflow API Client
import { supabase } from './supabaseClient';

// URL validation function
const validateApiUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  try {
    const urlObj = new URL(url);
    // Check if it's HTTP or HTTPS protocol
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch (error) {
    return false;
  }
};

// Get and validate API base URL
const getValidatedApiUrl = () => {
  const envUrl = process.env.REACT_APP_BACKEND_URL;
  const defaultUrl = 'http://localhost:8000/api/v2';
  
  // First, try the environment variable
  if (envUrl && validateApiUrl(envUrl)) {
    if (process.env.NODE_ENV === 'development') {
      console.log('Using API URL from environment:', envUrl);
      }
    return envUrl;
  }
  
  // If environment URL is invalid, log warning and check default
  if (envUrl && !validateApiUrl(envUrl)) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Invalid API URL in environment variable REACT_APP_BACKEND_URL:', envUrl);
      }
  }
  
  // Validate the default URL
  if (validateApiUrl(defaultUrl)) {
    if (process.env.NODE_ENV === 'development') {
      console.log('Using default API URL:', defaultUrl);
      }
    return defaultUrl;
  }
  
  // If even the default is invalid (should never happen), throw error
  throw new Error('No valid API URL available. Please check REACT_APP_BACKEND_URL environment variable.');
};

const API_BASE_URL = getValidatedApiUrl();
const API_TIMEOUT_MS = 10000; // 10 second timeout

class PMFusionAPI {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Helper method to get auth headers
  async getAuthHeaders() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return {
        'Content-Type': 'application/json',
        'Authorization': session?.access_token ? `Bearer ${session.access_token}` : undefined
      };
    } catch (error) {
      console.error('Error getting auth headers:', error);
      return {
        'Content-Type': 'application/json',
        'Authorization': session?.access_token ? `Bearer ${session.access_token}` : undefined
      };
    }
  }

  // Generic API request method with timeout
  async request(endpoint, options = {}) {
    const headers = await this.getAuthHeaders();
    
    const config = {
      headers,
      ...options,
    };

    try {
      // Create an AbortController to handle timeouts
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
      
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...config,
        signal: controller.signal
      });
      
      // Clear the timeout since the request completed
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        let errorMessage = `API Error: ${response.status} - ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage += ` - ${errorData.message || errorData.error || JSON.stringify(errorData)}`;
        } catch {
          const errorText = await response.text();
          errorMessage += ` - ${errorText}`;
        }
          throw new Error(errorMessage);      
      }
      
      return await response.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`API request timeout after ${API_TIMEOUT_MS}ms`);
      }
      console.error(`API Error for ${endpoint}:`, error);
      throw error;
    }
  }

  // ============================================================================
  // PHASE 1: PROJECT CREATION ENDPOINTS
  // ============================================================================

  async createProject(projectData) {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  }

  async getProjects() {
    return this.request('/projects');
  }

  async getProject(projectId) {
    return this.request(`/projects/${projectId}`);
  }

  // ============================================================================
  // PHASE 2: TEAMS EXECUTION ENDPOINTS
  // ============================================================================

  async getDisciplineKanban(disciplineId, projectId) {
    return this.request(`/disciplines/${disciplineId}/kanban?project_id=${projectId}`);
  }

  async updateTask(taskId, taskData) {
    return this.request(`/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(taskData),
    });
  }

  async assignTask(taskId, assigneeId) {
    return this.updateTask(taskId, { assignee_id: assigneeId });
  }

  async updateTaskStatus(taskId, status) {
    return this.updateTask(taskId, { status });
  }

  // ============================================================================
  // GENERAL ENDPOINTS
  // ============================================================================

  async getDisciplines() {
    return this.request('/disciplines');
  }

  async createDiscipline(disciplineData) {
    return this.request('/disciplines', {
      method: 'POST',
      body: JSON.stringify(disciplineData),
    });
  }

  async addDisciplineMember(name, userId) {
    return this.request(`/disciplines/${name}/members/${userId}`, {
      method: 'POST'
    });
  }

  async removeDisciplineMember(name, userId) {
    return this.request(`/disciplines/${name}/members/${userId}`, {
      method: 'DELETE'
    });
  }

  async healthCheck() {
    return this.request('/health');
  }
}

// Create singleton instance
const pmfusionAPI = new PMFusionAPI();
export default pmfusionAPI; 