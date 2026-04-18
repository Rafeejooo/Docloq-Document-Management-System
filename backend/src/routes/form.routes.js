// Form Routes

import { Router } from 'express';
import multer from 'multer';
import {
  getFormTemplates,
  getFormTemplate,
  createFormTemplate,
  updateFormTemplate,
  deleteFormTemplate,
  createBlankTemplate,
  uploadExistingTemplate,
  getTemplateDocument,
  getFormInstances,
  getFormInstance,
  createFormInstance,
  updateFormInstance,
  deleteFormInstance,
  updateWorkflowStep,
  getOrgUsers,
} from '../controllers/form.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validateUUID } from '../middlewares/validate.middleware.js';

const router = Router();

// All form routes require authentication
router.use(authenticate);

// Multer config for template file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/vnd.oasis.opendocument.text',
      'application/rtf',
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only PDF, DOCX, DOC, ODT, RTF files are allowed'));
  },
});

// ── Form Templates ────────────────────────────
// GET    /api/forms/templates              — list all templates
// POST   /api/forms/templates              — create template (JSON schema)
// POST   /api/forms/templates/create-blank — create blank docx template
// POST   /api/forms/templates/upload-file  — upload file as template (PDF→DOCX)
// GET    /api/forms/templates/:id          — single template
// GET    /api/forms/templates/:id/document — get template's document + OnlyOffice config
// PUT    /api/forms/templates/:id          — update template
// DELETE /api/forms/templates/:id          — delete template

router.get('/templates', getFormTemplates);
router.post('/templates', createFormTemplate);
router.post('/templates/create-blank', createBlankTemplate);
router.post('/templates/upload-file', upload.single('file'), uploadExistingTemplate);
router.get('/templates/:id', validateUUID('id'), getFormTemplate);
router.get('/templates/:id/document', validateUUID('id'), getTemplateDocument);
router.put('/templates/:id', validateUUID('id'), updateFormTemplate);
router.delete('/templates/:id', validateUUID('id'), deleteFormTemplate);

// ── Form Instances (created from templates) ───
// GET    /api/forms/instances          — list instances
// POST   /api/forms/instances          — create from template
// GET    /api/forms/instances/:id      — single instance
// PUT    /api/forms/instances/:id      — update instance
// DELETE /api/forms/instances/:id      — delete instance

router.get('/instances', getFormInstances);
router.post('/instances', createFormInstance);
router.get('/instances/:id', validateUUID('id'), getFormInstance);
router.put('/instances/:id', validateUUID('id'), updateFormInstance);
router.delete('/instances/:id', validateUUID('id'), deleteFormInstance);

// ── Workflow Steps ────────────────────────────
// PUT    /api/forms/workflow-steps/:id — update step status

router.put('/workflow-steps/:id', validateUUID('id'), updateWorkflowStep);

// ── Users (for assignment dropdowns) ──────────
// GET    /api/forms/users              — org users list

router.get('/users', getOrgUsers);

export default router;
