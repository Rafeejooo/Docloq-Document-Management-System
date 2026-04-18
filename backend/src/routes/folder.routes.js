// Folder Routes

import { Router } from 'express';
import {
  getAllFolders,
  getFolder,
  createFolder,
  updateFolder,
  deleteFolder,
  moveDocumentToFolder,
  moveFolder,
} from '../controllers/folder.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validateUUID } from '../middlewares/validate.middleware.js';

const router = Router();

// All folder routes require authentication
router.use(authenticate);

// GET    /api/folders              — all folders (flat, frontend builds tree)
// POST   /api/folders              — create folder
// GET    /api/folders/:id          — single folder + docs + children
// PUT    /api/folders/:id          — update (rename, color, etc.)
// DELETE /api/folders/:id          — soft-delete folder + descendants
// POST   /api/folders/move-document — move a document into a folder
// POST   /api/folders/move-folder   — move a folder to new parent

router.get('/', getAllFolders);
router.post('/', createFolder);
router.post('/move-document', moveDocumentToFolder);
router.post('/move-folder', moveFolder);
router.get('/:id', validateUUID('id'), getFolder);
router.put('/:id', validateUUID('id'), updateFolder);
router.delete('/:id', validateUUID('id'), deleteFolder);

export default router;
