// Blockchain Routes — Document anchoring and verification on Polygon
// All routes require authentication + admin/owner-level roles.

import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import {
  anchorDocumentHandler,
  updateAnchorHandler,
  verifyDocumentHandler,
  getDocumentAnchorHandler,
  setAutoAnchorHandler,
  anchorBatchHandler,
  getStatsHandler,
  getTransactionsHandler,
  updateWalletHandler,
} from '../controllers/blockchain.controller.js';

const router = Router();

// All blockchain routes require authentication
router.use(authenticate);

// Admin-level routes (stats, transactions, wallet, batch)
router.get('/stats', authorize(['super_admin', 'admin']), getStatsHandler);
router.get('/transactions', authorize(['super_admin', 'admin']), getTransactionsHandler);
router.put('/wallet', authorize(['super_admin', 'admin']), updateWalletHandler);
router.post('/anchor-batch', authorize(['super_admin', 'admin']), anchorBatchHandler);

// Document-specific routes (admin + manager can anchor/verify)
router.post('/anchor/:documentId', authorize(['super_admin', 'admin', 'manager']), anchorDocumentHandler);
router.put('/anchor/:documentId', authorize(['super_admin', 'admin', 'manager']), updateAnchorHandler);
router.post('/verify/:documentId', authorize(['super_admin', 'admin', 'manager']), verifyDocumentHandler);
router.get('/anchor/:documentId', authorize(['super_admin', 'admin', 'manager']), getDocumentAnchorHandler);
router.patch('/auto-anchor/:documentId', authorize(['super_admin', 'admin', 'manager']), setAutoAnchorHandler);

export default router;
