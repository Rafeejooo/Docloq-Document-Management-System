// DoKi Chatbot Controller — API handler for chatbot endpoints

import {
  processMessage,
  sanitizeInput,
  checkRateLimit,
  getSuggestionsForRole,
  logChatInteraction,
  getOrCreateSession,
  getSessionHistory,
} from '../services/chatbot.service.js';
import { db } from '../db/index.js';
import { chatSessions, users } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

/**
 * POST /api/chatbot/message
 * Send a message to DoKi and get a response
 */
export const sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const user = req.user;

    // Validate input
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    // Sanitize
    const sanitized = sanitizeInput(message);
    if (!sanitized || sanitized.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid message content',
      });
    }

    if (sanitized.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Message too long (max 2000 characters)',
      });
    }

    // Rate limit
    if (!checkRateLimit(user.userId)) {
      return res.status(429).json({
        success: false,
        message: 'Terlalu banyak pesan. Tunggu sebentar ya! ⏳',
      });
    }

    // Fetch firstName from DB
    const [dbUser] = await db
      .select({ firstName: users.firstName })
      .from(users)
      .where(eq(users.id, user.userId))
      .limit(1);
    const userName = dbUser?.firstName || user.email?.split('@')[0] || 'User';

    // Process message
    const response = await processMessage({
      message: sanitized,
      userId: user.userId,
      userRole: user.role,
      organizationId: user.organizationId,
      userName,
    });

    // Audit log (non-blocking)
    logChatInteraction(user.userId, user.organizationId, response.intent).catch(() => {});

    return res.json({
      success: true,
      data: {
        reply: response.reply,
        intent: response.intent,
        suggestions: response.suggestions || [],
        data: response.data || null,
      },
    });
  } catch (error) {
    console.error('DoKi sendMessage error:', error);
    return res.status(500).json({
      success: false,
      message: 'DoKi mengalami kesalahan. Coba lagi ya! 🔄',
    });
  }
};

/**
 * GET /api/chatbot/history
 * Get chat history for current user
 */
export const getHistory = async (req, res) => {
  try {
    const user = req.user;

    const session = await getOrCreateSession(user.userId, user.organizationId);
    const messages = await getSessionHistory(session.id, 50);

    return res.json({
      success: true,
      data: {
        sessionId: session.id,
        messages: messages.map(m => ({
          id: m.id,
          role: m.role,
          content: m.content,
          createdAt: m.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('DoKi getHistory error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil riwayat chat',
    });
  }
};

/**
 * DELETE /api/chatbot/history
 * Clear chat history — deactivate current session and start fresh
 */
export const clearHistory = async (req, res) => {
  try {
    const user = req.user;

    // Deactivate all active sessions for this user
    await db
      .update(chatSessions)
      .set({ isActive: false })
      .where(
        and(
          eq(chatSessions.userId, user.userId),
          eq(chatSessions.isActive, true),
        )
      );

    return res.json({
      success: true,
      message: 'Riwayat chat berhasil dihapus',
    });
  } catch (error) {
    console.error('DoKi clearHistory error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menghapus riwayat chat',
    });
  }
};

/**
 * GET /api/chatbot/suggestions
 * Get quick action suggestions based on user role
 */
export const getSuggestions = async (req, res) => {
  try {
    const user = req.user;
    const suggestions = getSuggestionsForRole(user.role);

    return res.json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    console.error('DoKi getSuggestions error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil suggestions',
    });
  }
};

export default {
  sendMessage,
  getHistory,
  clearHistory,
  getSuggestions,
};
