// Folder Routes

import { Router } from 'express';
import {
  getAllFolders,
  getFolder,
  createFolder,
  updateFolder,
  deleteFolder,
  moveDocumentToFolder,
} from '../controllers/folder.controller.js';

const router = Router();

// GET    /api/folders              — all folders (flat, frontend builds tree)
// POST   /api/folders              — create folder
// GET    /api/folders/:id          — single folder + docs + children
// PUT    /api/folders/:id          — update (rename, color, etc.)
// DELETE /api/folders/:id          — soft-delete folder + descendants
// POST   /api/folders/move-document — move a document into a folder

router.get('/', getAllFolders);
router.post('/', createFolder);
router.post('/move-document', moveDocumentToFolder);
router.get('/:id', getFolder);
router.put('/:id', updateFolder);
router.delete('/:id', deleteFolder);

export default router;
