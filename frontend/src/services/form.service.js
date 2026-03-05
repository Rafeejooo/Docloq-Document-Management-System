// Form Service - API calls for form templates, instances, workflow

import api from './api';

const formService = {
  // ── Templates ───────────────────────────────
  getTemplates: async () => {
    const response = await api.get('/forms/templates');
    return response.data;
  },

  getTemplate: async (id) => {
    const response = await api.get(`/forms/templates/${id}`);
    return response.data;
  },

  createTemplate: async (data) => {
    const response = await api.post('/forms/templates', data);
    return response.data;
  },

  updateTemplate: async (id, data) => {
    const response = await api.put(`/forms/templates/${id}`, data);
    return response.data;
  },

  deleteTemplate: async (id) => {
    const response = await api.delete(`/forms/templates/${id}`);
    return response.data;
  },

  // ── Instances ───────────────────────────────
  getInstances: async () => {
    const response = await api.get('/forms/instances');
    return response.data;
  },

  getInstance: async (id) => {
    const response = await api.get(`/forms/instances/${id}`);
    return response.data;
  },

  createInstance: async (data) => {
    const response = await api.post('/forms/instances', data);
    return response.data;
  },

  updateInstance: async (id, data) => {
    const response = await api.put(`/forms/instances/${id}`, data);
    return response.data;
  },

  deleteInstance: async (id) => {
    const response = await api.delete(`/forms/instances/${id}`);
    return response.data;
  },

  // ── Workflow Steps ──────────────────────────
  updateWorkflowStep: async (id, data) => {
    const response = await api.put(`/forms/workflow-steps/${id}`, data);
    return response.data;
  },

  // ── Users (for assignment) ──────────────────
  getUsers: async () => {
    const response = await api.get('/forms/users');
    return response.data;
  },
};

export default formService;
