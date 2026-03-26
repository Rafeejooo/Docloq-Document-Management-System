// AI Document Analysis Controller

import {
  getDocumentsForAnalysis,
  grantAIAccess,
  revokeAIAccess,
  analyzeDocument,
  getDocumentAIStatus,
  getAnalysisHistory,
  getDocumentPageInfo,
  getQuotaStatus,
} from '../services/ai-analysis.service.js';

/**
 * GET /api/ai-analysis/documents
 * List all documents with AI access status
 */
export const listDocuments = async (req, res) => {
  try {
    const { search } = req.query;
    const docs = await getDocumentsForAnalysis(
      req.user.id,
      req.user.organizationId,
      req.user.role,
      search || '',
    );

    res.json({ success: true, data: docs });
  } catch (error) {
    console.error('[AI Analysis] listDocuments error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/ai-analysis/documents/:id/grant
 * Grant AI access — decrypt, embed, index in Qdrant
 */
export const grant = async (req, res) => {
  try {
    const result = await grantAIAccess(
      req.params.id,
      req.user.id,
      req.user.organizationId,
    );

    if (result.alreadyGranted) {
      return res.json({ success: true, message: 'AI access already granted', data: result });
    }

    res.json({ success: true, message: 'AI access granted successfully', data: result });
  } catch (error) {
    console.error('[AI Analysis] grant error:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/ai-analysis/documents/:id/revoke
 * Revoke AI access — delete vector from Qdrant
 */
export const revoke = async (req, res) => {
  try {
    const result = await revokeAIAccess(
      req.params.id,
      req.user.id,
      req.user.organizationId,
    );

    res.json({ success: true, message: 'AI access revoked successfully', data: result });
  } catch (error) {
    console.error('[AI Analysis] revoke error:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/ai-analysis/documents/:id/analyze
 * Analyze document content with AI prompt + optional page selection
 */
export const analyze = async (req, res) => {
  try {
    const { prompt, pageRange } = req.body;
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ success: false, message: 'Prompt is required' });
    }

    // Validate pageRange if provided
    let validatedPageRange = null;
    if (pageRange && Array.isArray(pageRange)) {
      validatedPageRange = pageRange
        .filter(p => typeof p === 'number' && p >= 1)
        .map(p => Math.floor(p));
    }

    const result = await analyzeDocument(
      req.params.id,
      prompt,
      req.user.id,
      req.user.organizationId,
      { pageRange: validatedPageRange },
    );

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[AI Analysis] analyze error:', error.message);
    const status = error.message.includes('quota') ? 429 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/ai-analysis/documents/:id/page-info
 * Get page count, content type, and page details for page selector
 */
export const pageInfo = async (req, res) => {
  try {
    const result = await getDocumentPageInfo(
      req.params.id,
      req.user.organizationId,
    );

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[AI Analysis] pageInfo error:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/ai-analysis/quota
 * Get organization's AI quota usage
 */
export const quota = async (req, res) => {
  try {
    const result = await getQuotaStatus(req.user.organizationId);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[AI Analysis] quota error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/ai-analysis/documents/:id/history
 * Get analysis history for a document
 */
export const history = async (req, res) => {
  try {
    const data = await getAnalysisHistory(req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    console.error('[AI Analysis] history error:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/ai-analysis/documents/:id/status
 * Check document AI access status
 */
export const status = async (req, res) => {
  try {
    const result = await getDocumentAIStatus(
      req.params.id,
      req.user.organizationId,
    );

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[AI Analysis] status error:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};
