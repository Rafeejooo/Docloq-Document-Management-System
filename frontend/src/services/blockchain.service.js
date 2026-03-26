// Blockchain Service - API calls for document blockchain anchoring & verification

import api from './api';

const blockchainService = {
  // Anchor a document to blockchain
  anchorDocument: async (documentId) => {
    const response = await api.post(`/blockchain/anchor/${documentId}`);
    return response.data;
  },

  // Update anchor (re-anchor after edit)
  updateAnchor: async (documentId) => {
    const response = await api.put(`/blockchain/anchor/${documentId}`);
    return response.data;
  },

  // Verify document against blockchain
  verifyDocument: async (documentId) => {
    const response = await api.post(`/blockchain/verify/${documentId}`);
    return response.data;
  },

  // Get anchor info for a document
  getAnchorInfo: async (documentId) => {
    const response = await api.get(`/blockchain/anchor/${documentId}`);
    return response.data;
  },

  // Toggle auto-anchor on edit
  setAutoAnchor: async (documentId, enabled) => {
    const response = await api.patch(`/blockchain/auto-anchor/${documentId}`, { enabled });
    return response.data;
  },

  // Batch anchor multiple documents
  anchorBatch: async (documentIds) => {
    const response = await api.post('/blockchain/anchor-batch', { documentIds });
    return response.data;
  },

  // Get blockchain stats (admin dashboard)
  getStats: async () => {
    const response = await api.get('/blockchain/stats');
    return response.data;
  },

  // Get transaction history
  getTransactions: async (params = {}) => {
    const response = await api.get('/blockchain/transactions', { params });
    return response.data;
  },
};

export default blockchainService;
