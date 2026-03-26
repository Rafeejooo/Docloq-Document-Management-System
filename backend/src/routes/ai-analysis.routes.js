// AI Document Analysis Routes — All routes require authentication

import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import {
  listDocuments,
  grant,
  revoke,
  analyze,
  history,
  status,
  pageInfo,
  quota,
} from '../controllers/ai-analysis.controller.js';

const router = Router();

// ALL AI analysis routes require authentication
router.use(authenticate);

// Organization-level quota status
router.get('/quota', quota);

// List all documents with AI access status
router.get('/documents', listDocuments);

// Grant AI access (decrypt + embed + index)
router.post('/documents/:id/grant', grant);

// Revoke AI access (delete vector)
router.post('/documents/:id/revoke', revoke);

// Analyze document with AI prompt + page selection
router.post('/documents/:id/analyze', analyze);

// Get page info for page selector (requires AI access)
router.get('/documents/:id/page-info', pageInfo);

// Analysis history
router.get('/documents/:id/history', history);

// Check document AI status
router.get('/documents/:id/status', status);

export default router;
