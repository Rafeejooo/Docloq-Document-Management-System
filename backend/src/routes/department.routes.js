// Department Management Routes

import { Router } from 'express';
import {
  getDepartments,
  getDepartmentById,
  getDepartmentMembers,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../controllers/department.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

// All users can view departments (needed for dropdowns)
router.get('/', getDepartments);

// Admin-only CRUD
router.get('/:id', authorize(['admin', 'super_admin']), getDepartmentById);
router.get('/:id/members', authorize(['admin', 'super_admin']), getDepartmentMembers);
router.post('/', authorize(['admin', 'super_admin']), createDepartment);
router.put('/:id', authorize(['admin', 'super_admin']), updateDepartment);
router.delete('/:id', authorize(['admin', 'super_admin']), deleteDepartment);

export default router;
