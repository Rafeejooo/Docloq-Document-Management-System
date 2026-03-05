// Trash Routes

import { Router } from 'express';
import {
  listTrash,
  restoreItem,
  permanentDelete,
  emptyTrash,
} from '../controllers/trash.controller.js';
import { optionalAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', optionalAuth, listTrash);
router.post('/:id/restore', optionalAuth, restoreItem);
router.delete('/:id', optionalAuth, permanentDelete);
router.delete('/', optionalAuth, emptyTrash);

export default router;
