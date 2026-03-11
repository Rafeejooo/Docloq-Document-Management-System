// Signing Service - API calls for DocuSeal e-signing integration

import api from './api';

const signingService = {
  /**
   * Create a signing request for a task
   * @param {string} taskId - Task ID
   * @param {string} documentId - Document ID to sign
   * @param {object} options - Optional signing options
   * @param {object} options.signatureField - Custom signature field placement { x, y, w, h, page }
   */
  requestSigning: async (taskId, documentId, options = {}) => {
    const response = await api.post('/signing/request', {
      taskId,
      documentId,
      ...options,
    });
    return response.data;
  },

  /**
   * Get signing status for a task
   * @param {string} taskId - Task ID
   */
  getSigningStatus: async (taskId) => {
    const response = await api.get(`/signing/${taskId}/status`);
    return response.data;
  },

  /**
   * Manually poll DocuSeal for updated signing status
   * @param {string} taskId - Task ID
   */
  checkSigningStatus: async (taskId) => {
    const response = await api.post(`/signing/${taskId}/check`);
    return response.data;
  },

  /**
   * Remove background from a signature image (make transparent PNG)
   * @param {string} imageBase64 - Base64 string (data URL or raw)
   * @returns {{ data: { image: string } }} - Transparent PNG as data URL
   */
  removeBackground: async (imageBase64) => {
    const response = await api.post('/signing/remove-bg', {
      image: imageBase64,
    });
    return response.data;
  },

  /**
   * Get signed document info / download
   * @param {string} signatureId - Signature record ID
   */
  getSignedDocuments: async (signatureId) => {
    const response = await api.get(`/signing/${signatureId}/documents`);
    return response.data;
  },
};

export default signingService;
