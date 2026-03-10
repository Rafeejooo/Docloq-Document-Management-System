// DoKi Chatbot Routes — All routes require authentication

import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import {
  sendMessage,
  getHistory,
  clearHistory,
  getSuggestions,
} from '../controllers/chatbot.controller.js';

const router = Router();

// ALL chatbot routes require authentication — no exceptions
router.use(authenticate);

// POST /api/chatbot/message      — send message to DoKi
// GET  /api/chatbot/history      — get chat history
// DELETE /api/chatbot/history    — clear chat history
// GET  /api/chatbot/suggestions  — get role-based suggestions

router.post('/message', sendMessage);
router.get('/history', getHistory);
router.delete('/history', clearHistory);
router.get('/suggestions', getSuggestions);

export default router;
