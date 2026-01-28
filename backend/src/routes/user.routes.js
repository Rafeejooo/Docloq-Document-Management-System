// User Management Routes

import { Router } from 'express';
import { 
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  toggleUserStatus,
} from '../controllers/user.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

// User CRUD (Admin only)
router.get('/', authorize(['admin', 'super_admin']), getUsers);
router.get('/:id', authorize(['admin', 'super_admin']), getUserById);
router.post('/', authorize(['admin', 'super_admin']), createUser);
router.put('/:id', authorize(['admin', 'super_admin']), updateUser);
router.patch('/:id', authorize(['admin', 'super_admin']), updateUser);
router.delete('/:id', authorize(['admin', 'super_admin']), deleteUser);

// User Actions (Admin only)
router.post('/:id/reset-password', authorize(['admin', 'super_admin']), resetUserPassword);
router.patch('/:id/toggle-status', authorize(['admin', 'super_admin']), toggleUserStatus);

export default router;
