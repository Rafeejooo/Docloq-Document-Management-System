// Blockchain Routes — Document anchoring and verification on Polygon
// All routes require authentication + admin/owner-level roles.

import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validateUUID } from '../middlewares/validate.middleware.js';
import uploadConfig from '../config/upload.config.js';
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

// Router-level guard: return 503 if blockchain is not enabled
router.use((req, res, next) => {
  if (!uploadConfig.blockchain?.enabled) {
    return res.status(503).json({
      success: false,
      message: 'Blockchain service is not enabled on this instance',
    });
  }
  next();
});

// All blockchain routes require authentication
router.use(authenticate);

// Admin-level routes (stats, transactions, wallet, batch)
router.get('/stats', authorize(['super_admin', 'admin']), getStatsHandler);
router.get('/transactions', authorize(['super_admin', 'admin']), getTransactionsHandler);
router.put('/wallet', authorize(['super_admin', 'admin']), updateWalletHandler);
router.post('/anchor-batch', authorize(['super_admin', 'admin']), anchorBatchHandler);

// Document-specific routes (admin + manager can anchor/verify)
router.post('/anchor/:documentId', authorize(['super_admin', 'admin', 'manager']), validateUUID('documentId'), anchorDocumentHandler);
router.put('/anchor/:documentId', authorize(['super_admin', 'admin', 'manager']), validateUUID('documentId'), updateAnchorHandler);
router.post('/verify/:documentId', authorize(['super_admin', 'admin', 'manager']), validateUUID('documentId'), verifyDocumentHandler);
router.get('/anchor/:documentId', authorize(['super_admin', 'admin', 'manager']), validateUUID('documentId'), getDocumentAnchorHandler);
router.patch('/auto-anchor/:documentId', authorize(['super_admin', 'admin', 'manager']), validateUUID('documentId'), setAutoAnchorHandler);

export default router;
