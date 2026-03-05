// Form Routes

import { Router } from 'express';
import {
  getFormTemplates,
  getFormTemplate,
  createFormTemplate,
  updateFormTemplate,
  deleteFormTemplate,
  getFormInstances,
  getFormInstance,
  createFormInstance,
  updateFormInstance,
  deleteFormInstance,
  updateWorkflowStep,
  getOrgUsers,
} from '../controllers/form.controller.js';

const router = Router();

// ── Form Templates ────────────────────────────
// GET    /api/forms/templates          — list all templates
// POST   /api/forms/templates          — create template
// GET    /api/forms/templates/:id      — single template
// PUT    /api/forms/templates/:id      — update template
// DELETE /api/forms/templates/:id      — delete template

router.get('/templates', getFormTemplates);
router.post('/templates', createFormTemplate);
router.get('/templates/:id', getFormTemplate);
router.put('/templates/:id', updateFormTemplate);
router.delete('/templates/:id', deleteFormTemplate);

// ── Form Instances (created from templates) ───
// GET    /api/forms/instances          — list instances
// POST   /api/forms/instances          — create from template
// GET    /api/forms/instances/:id      — single instance
// PUT    /api/forms/instances/:id      — update instance
// DELETE /api/forms/instances/:id      — delete instance

router.get('/instances', getFormInstances);
router.post('/instances', createFormInstance);
router.get('/instances/:id', getFormInstance);
router.put('/instances/:id', updateFormInstance);
router.delete('/instances/:id', deleteFormInstance);

// ── Workflow Steps ────────────────────────────
// PUT    /api/forms/workflow-steps/:id — update step status

router.put('/workflow-steps/:id', updateWorkflowStep);

// ── Users (for assignment dropdowns) ──────────
// GET    /api/forms/users              — org users list

router.get('/users', getOrgUsers);

export default router;
