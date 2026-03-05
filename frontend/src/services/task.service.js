// Task Service - API calls for task management

import api from './api';

const taskService = {
  // Get all tasks (optional filters)
  getTasks: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.priority) params.append('priority', filters.priority);
    const query = params.toString();
    const response = await api.get(`/tasks${query ? '?' + query : ''}`);
    return response.data;
  },

  // Get single task
  getTask: async (id) => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  // Create task
  createTask: async (data) => {
    const response = await api.post('/tasks', data);
    return response.data;
  },

  // Update task
  updateTask: async (id, data) => {
    const response = await api.put(`/tasks/${id}`, data);
    return response.data;
  },

  // Complete task (syncs workflow)
  completeTask: async (id) => {
    const response = await api.put(`/tasks/${id}/complete`);
    return response.data;
  },

  // Submit workflow action (fill/review/approve)
  submitAction: async (id, data = {}) => {
    const response = await api.put(`/tasks/${id}/submit`, data);
    return response.data;
  },

  // Get task document config (OnlyOffice config based on task role)
  getTaskDocumentConfig: async (id) => {
    const response = await api.get(`/tasks/${id}/document-config`);
    return response.data;
  },

  // Delete task
  deleteTask: async (id) => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },

  // Add comment
  addComment: async (taskId, content) => {
    const response = await api.post(`/tasks/${taskId}/comments`, { content });
    return response.data;
  },
};

export default taskService;
