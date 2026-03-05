// Route Aggregator

import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import totpRoutes from './totp.routes.js';
import documentRoutes from './document.routes.js';
import folderRoutes from './folder.routes.js';
import formRoutes from './form.routes.js';
import taskRoutes from './task.routes.js';
import adminRoutes from './admin.routes.js';

const router = Router();

// API Routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/totp', totpRoutes);
router.use('/documents', documentRoutes);
router.use('/folders', folderRoutes);
router.use('/forms', formRoutes);
router.use('/tasks', taskRoutes);
router.use('/admin', adminRoutes);

// Health Check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;
