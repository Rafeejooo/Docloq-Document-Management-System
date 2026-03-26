// Watermark Scanner Routes — Admin-level routes for leak detection

import { Router } from 'express';
import multer from 'multer';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import {
  scanForWatermark,
  getWatermarkHistory,
  getWatermarkDetails,
} from '../controllers/watermark-scanner.controller.js';

const router = Router();

// Multer for in-memory file upload (scanner accepts any document)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

// All scanner routes require authentication + admin-level roles
router.use(authenticate);
router.use(authorize(['super_admin', 'admin', 'manager', 'auditor']));

// Scan uploaded file for watermarks
router.post('/scan', upload.single('file'), scanForWatermark);

// Get watermark download history for a document
router.get('/history/:documentId', getWatermarkHistory);

// Get specific watermark details
router.get('/details/:watermarkId', getWatermarkDetails);

export default router;
