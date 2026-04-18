// Signing Routes — DocuSeal e-signing integration

import { Router } from 'express';
import {
  createSigningRequest,
  getSigningStatus,
  manualCheckStatus,
  handleWebhook,
  getSignedDocuments,
  serveSignedDocumentFile,
  removeSignatureBackground,
} from '../controllers/signing.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validateUUID } from '../middlewares/validate.middleware.js';

const router = Router();

// ── Public routes (no auth — called by external services) ──
router.post('/webhook', handleWebhook);
router.get('/:signatureId/file', validateUUID('signatureId'), serveSignedDocumentFile); // OnlyOffice calls this to load signed PDFs

// ── All other routes require authentication ──
router.use(authenticate);

// POST   /api/signing/request           — create signing request for a task
// GET    /api/signing/:taskId/status     — get signing status
// POST   /api/signing/:taskId/check      — manual poll DocuSeal status
// GET    /api/signing/:signatureId/documents — get/download signed documents
// POST   /api/signing/remove-bg          — remove background from signature image

router.post('/request', createSigningRequest);
router.post('/remove-bg', removeSignatureBackground);
router.get('/:taskId/status', validateUUID('taskId'), getSigningStatus);
router.post('/:taskId/check', validateUUID('taskId'), manualCheckStatus);
router.get('/:signatureId/documents', validateUUID('signatureId'), getSignedDocuments);

export default router;
