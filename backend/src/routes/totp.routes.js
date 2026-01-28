// Two-Factor Auth Routes

import { Router } from 'express';
import {
  generateTOTPSecret,
  enableTOTP,
  disableTOTP,
  verifyTOTPLogin,
  getTOTPStatus,
} from '../controllers/totp.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// Public - Verify saat login
router.post('/verify-login', verifyTOTPLogin);

// Protected - Butuh authentication
router.use(authenticate);
router.get('/status', getTOTPStatus);
router.post('/generate', generateTOTPSecret);
router.post('/enable', enableTOTP);
router.post('/disable', disableTOTP);

export default router;
