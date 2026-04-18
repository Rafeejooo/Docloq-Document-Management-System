// Role Management Routes

import { Router } from 'express';
import {
  getRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  assignUsersToRole,
  removeUserFromRole,
  getUserPermissions,
} from '../controllers/role.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validateUUID } from '../middlewares/validate.middleware.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get current user's own permissions (any authenticated user)
router.get('/my-permissions', getUserPermissions);

// Role CRUD (Admin/Super Admin only)
router.get('/', authorize(['admin', 'super_admin']), getRoles);
router.get('/:id', authorize(['admin', 'super_admin']), validateUUID('id'), getRole);
router.post('/', authorize(['admin', 'super_admin']), createRole);
router.put('/:id', authorize(['admin', 'super_admin']), validateUUID('id'), updateRole);
router.delete('/:id', authorize(['admin', 'super_admin']), validateUUID('id'), deleteRole);

// User assignment (Admin/Super Admin only)
router.post('/:id/assign', authorize(['admin', 'super_admin']), validateUUID('id'), assignUsersToRole);
router.delete('/:id/users/:userId', authorize(['admin', 'super_admin']), validateUUID('id', 'userId'), removeUserFromRole);

// Get specific user's permissions (Admin/Super Admin only)
router.get('/user/:userId/permissions', authorize(['admin', 'super_admin']), validateUUID('userId'), getUserPermissions);

export default router;
