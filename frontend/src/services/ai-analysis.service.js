// AI Document Analysis API Service

import api from './api';

const aiAnalysisService = {
  // List all documents with AI access status
  getDocuments: (search = '') => {
    const params = search ? { search } : {};
    return api.get('/ai-analysis/documents', { params });
  },

  // Grant AI access (decrypt + embed + index in Qdrant)
  grantAccess: (documentId) => {
    return api.post(`/ai-analysis/documents/${documentId}/grant`);
  },

  // Revoke AI access (delete vector from Qdrant)
  revokeAccess: (documentId) => {
    return api.post(`/ai-analysis/documents/${documentId}/revoke`);
  },

  // Analyze document with AI prompt + optional page range
  analyzeDocument: (documentId, prompt, pageRange = null) => {
    const body = { prompt };
    if (pageRange && pageRange.length > 0) {
      body.pageRange = pageRange;
    }
    return api.post(`/ai-analysis/documents/${documentId}/analyze`, body);
  },

  // Get page info for page selector (page count, content type, page details)
  getPageInfo: (documentId) => {
    return api.get(`/ai-analysis/documents/${documentId}/page-info`);
  },

  // Get organization AI quota usage
  getQuota: () => {
    return api.get('/ai-analysis/quota');
  },

  // Get analysis history for a document
  getHistory: (documentId) => {
    return api.get(`/ai-analysis/documents/${documentId}/history`);
  },

  // Check document AI status
  getStatus: (documentId) => {
    return api.get(`/ai-analysis/documents/${documentId}/status`);
  },
};

export default aiAnalysisService;
