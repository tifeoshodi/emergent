// PMFusion Three-Phase Workflow API Client
import { supabase } from './supabaseClient';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api/v2';
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
        'Authorization': `Bearer ${session?.access_token || 'demo-token'}`
      };
    } catch (error) {
      console.error('Error getting auth headers:', error);
      return {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer demo-token'
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
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${response.statusText} - ${errorText}`);
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

  async healthCheck() {
    return this.request('/health');
  }
}

// Create singleton instance
const pmfusionAPI = new PMFusionAPI();
export default pmfusionAPI; 