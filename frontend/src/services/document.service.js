// Document Service - API calls for document management

import api from './api';

const documentService = {
  // Get all documents
  getAllDocuments: async () => {
    const response = await api.get('/documents');
    return response.data;
  },

  // Get single document
  getDocument: async (id) => {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  },

  // Upload document
  uploadDocument: async (file, onProgress, folderId) => {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId) formData.append('folderId', folderId);

    const response = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });
    return response.data;
  },

  // Download document
  downloadDocument: async (id, filename) => {
    const response = await api.get(`/documents/${id}/download`, {
      responseType: 'blob',
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // Delete document
  deleteDocument: async (id) => {
    const response = await api.delete(`/documents/${id}`);
    return response.data;
  },

  // Get OnlyOffice config
  getOnlyOfficeConfig: async (id, mode = 'view') => {
    const response = await api.get(`/documents/${id}/onlyoffice-config`, {
      params: { mode },
    });
    return response.data;
  },

  // Get file URL for OnlyOffice
  getFileUrl: (id) => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    return `${baseUrl}/documents/${id}/file`;
  },
};

export default documentService;
