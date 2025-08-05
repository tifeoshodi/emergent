// PMFusion Three-Phase Workflow API Client

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
  // Default to the v1 API running locally
  const defaultUrl = 'http://localhost:8000/api';
  
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
  async getAuthHeaders(includeContentType = true) {
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    // Use demo user as fallback if no user is logged in
    const demoUserId = 'aa83214c-367b-4231-a682-0bcc4417d954';
    
    const headers = {
      'X-User-ID': userId || demoUserId
    };
    
    if (includeContentType) {
      headers['Content-Type'] = 'application/json';
    }
    
    return headers;
  }

  // Generic API request method with timeout
  async request(endpoint, method = 'GET', body = null) {
    const headers = await this.getAuthHeaders();
    
    const config = {
      method,
      headers,
    };

    if (body && typeof body === 'string') {
      config.body = body;
    } else if (body && typeof body === 'object') {
      config.body = JSON.stringify(body);
    }

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

  // File upload method
  async uploadFile(endpoint, formData) {
    const headers = await this.getAuthHeaders(false); // Don't include Content-Type for FormData
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS * 3); // Longer timeout for uploads
      
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        let errorMessage = `Upload Error: ${response.status} - ${response.statusText}`;
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
        throw new Error(`Upload timeout after ${API_TIMEOUT_MS * 3}ms`);
      }
      console.error(`Upload Error for ${endpoint}:`, error);
      throw error;
    }
  }

  // File download method
  async downloadFile(endpoint, filename) {
    const headers = await this.getAuthHeaders(false); // Don't include Content-Type for downloads
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS * 2); // Longer timeout for downloads
      
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'GET',
        headers,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} - ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return true;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`Download timeout after ${API_TIMEOUT_MS * 2}ms`);
      }
      console.error(`Download Error for ${endpoint}:`, error);
      throw error;
    }
  }

  // ============================================================================
  // PHASE 1: PROJECT CREATION ENDPOINTS
  // ============================================================================

  async createProject(projectData) {
    return this.request('/projects', 'POST', projectData);
  }

  async getProjects() {
    return this.request('/projects');
  }

  async getProject(projectId) {
    return this.request(`/projects/${projectId}`);
  }

  async updateProject(projectId, projectData) {
    return this.request(`/projects/${projectId}`, 'PUT', projectData);
  }

  async generateProjectWBS(projectId) {
    return this.request(`/projects/${projectId}/wbs`, 'POST');
  }

  async getProjectWBS(projectId) {
    return this.request(`/projects/${projectId}/wbs`);
  }

  async syncTasksFromWBS(projectId) {
    return this.request(`/projects/${projectId}/wbs/sync-tasks`, 'POST');
  }

  async getTasks(projectId = null) {
    const endpoint = projectId ? `/tasks?project_id=${projectId}` : '/tasks';
    return this.request(endpoint);
  }

  async assignTask(taskId, assignedTo) {
    return this.request(`/tasks/${taskId}/assign`, 'PUT', { assigned_to: assignedTo });
  }

  async getDisciplineUsers(discipline) {
    return this.request(`/disciplines/${discipline}/users`);
  }

  // ============================================================================
  // PHASE 2: TEAMS EXECUTION ENDPOINTS
  // ============================================================================

  async getDisciplineKanban(disciplineId, projectId) {
    return this.request(`/disciplines/${disciplineId}/kanban?project_id=${projectId}`);
  }

  async updateTask(taskId, taskData) {
    return this.request(`/tasks/${taskId}`, 'PUT', taskData);
  }

  async assignTaskToUser(taskId, assigneeId) {
    return this.updateTask(taskId, { assigned_to: assigneeId });
  }

  async updateTaskStatus(taskId, status) {
    return this.updateTask(taskId, { status });
  }

  // ========================================================================
  // PHASE 3: DOCUMENT CONTROL ENDPOINTS
  // ========================================================================

  async getDocuments(params = {}) {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.review_step) query.append('review_step', params.review_step);
    if (params.project_id) query.append('project_id', params.project_id);
    const qs = query.toString();
    const endpoint = qs ? `/documents?${qs}` : '/documents';
    return this.request(endpoint);
  }

  async getDccDocuments() {
    return this.request('/documents/dcc');
  }

  async finalizeDocument(documentId) {
    return this.request(`/documents/${documentId}/dcc_finalize`, 'POST');
  }

  async updateDocumentStatus(documentId, statusData) {
    return this.request(`/documents/${documentId}/status`, 'PUT', statusData);
  }

  async getDocumentAnalytics(projectId) {
    const endpoint = projectId
      ? `/documents/analytics/summary?project_id=${projectId}`
      : '/documents/analytics/summary';
    return this.request(endpoint);
  }

  // ============================================================================
  // GENERAL ENDPOINTS
  // ============================================================================

  async getDisciplines() {
    return this.request('/disciplines');
  }

  async createDiscipline(disciplineData) {
    return this.request('/disciplines', 'POST', disciplineData);
  }

  async addDisciplineMember(name, userId) {
    return this.request(`/disciplines/${name}/members/${userId}`, 'POST');
  }

  async removeDisciplineMember(name, userId) {
    return this.request(`/disciplines/${name}/members/${userId}`, 'DELETE');
  }

  // ============================================================================
  // USER MANAGEMENT ENDPOINTS
  // ============================================================================

  async getUsers() {
    return this.request('/users');
  }

  async getUser(userId) {
    return this.request(`/users/${userId}`);
  }

  async createUser(userData) {
    return this.request('/users', 'POST', userData);
  }

  async updateUser(userId, userData) {
    return this.request(`/users/${userId}`, 'PUT', userData);
  }

  // ============================================================================
  // MDR (Master Document Register) ENDPOINTS
  // ============================================================================

  async uploadMDR(formData) {
    return this.uploadFile('/mdr/upload', formData);
  }

  async getMDREntries(projectId, filters = {}) {
    let endpoint = `/mdr/entries/${projectId}`;
    const params = new URLSearchParams();
    
    if (filters.discipline) params.append('discipline', filters.discipline);
    if (filters.status) params.append('status', filters.status);
    
    const queryString = params.toString();
    if (queryString) {
      endpoint += `?${queryString}`;
    }
    
    return this.request(endpoint);
  }

  async getMDRDashboard(projectId) {
    return this.request(`/mdr/dashboard/${projectId}`);
  }

  async updateMDREntry(entryId, entryData) {
    return this.request(`/mdr/entries/${entryId}`, 'PUT', entryData);
  }

  async deleteMDREntry(entryId) {
    return this.request(`/mdr/entries/${entryId}`, 'DELETE');
  }

  async getMDRKanban(projectId, discipline = null) {
    let endpoint = `/mdr/kanban/${projectId}`;
    if (discipline) {
      endpoint += `?discipline=${discipline}`;
    }
    return this.request(endpoint);
  }

  async healthCheck() {
    return this.request('/health');
  }
}

// Create singleton instance
const pmfusionAPI = new PMFusionAPI();
export default pmfusionAPI; 