// Admin Routes

import { Router } from 'express';
import { 
  adminLogin, 
  adminVerifyOTP,
  adminResendOTP,
  adminLogout, 
  getAdminMe, 
  getDashboardStats,
  getAllUsers,
  getAllOrganizations,
  getPaymentHistory,
  getRecentActivity,
  updateUserStatus,
  getAdminAuditLogs,
} from '../controllers/admin.controller.js';
import { authenticateAdmin, requireSuperAdmin } from '../middlewares/admin.middleware.js';

const router = Router();

// Public Routes (no auth required)
router.post('/login', adminLogin);
router.post('/verify-otp', adminVerifyOTP);
router.post('/resend-otp', adminResendOTP);

// Protected Routes (admin auth required)
router.post('/logout', authenticateAdmin, adminLogout);
router.get('/me', authenticateAdmin, getAdminMe);
router.get('/dashboard/stats', authenticateAdmin, getDashboardStats);
router.get('/users', authenticateAdmin, getAllUsers);
router.get('/organizations', authenticateAdmin, getAllOrganizations);
router.get('/payments', authenticateAdmin, getPaymentHistory);
router.get('/activity', authenticateAdmin, getRecentActivity);
router.get('/audit-logs', authenticateAdmin, getAdminAuditLogs);
router.patch('/users/:userId/status', authenticateAdmin, updateUserStatus);

export default router;
