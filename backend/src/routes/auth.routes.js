// Authentication Routes

import { Router } from 'express';
import { 
  login, 
  register, 
  logout, 
  getMe, 
  refreshToken,
  completeLogin,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// Public Routes
router.post('/login', login);
router.post('/complete-login', completeLogin);
router.post('/register', register);
router.post('/refresh-token', refreshToken);

// Protected Routes
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.post('/heartbeat', authenticate, (req, res) => {
  // lastActivityAt is already updated by authenticate middleware
  res.json({ success: true, message: 'Session active' });
});

export default router;
