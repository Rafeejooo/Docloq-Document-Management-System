// DoKi Chatbot Service — Frontend API calls

import api from './api';

const chatbotService = {
  /**
   * Send a message to DoKi chatbot
   * @param {string} message - User message
   * @returns {{ reply, intent, suggestions, data }}
   */
  async sendMessage(message) {
    const response = await api.post('/chatbot/message', { message });
    return response.data;
  },

  /**
   * Get chat history for current session
   * @returns {{ sessionId, messages[] }}
   */
  async getHistory() {
    const response = await api.get('/chatbot/history');
    return response.data;
  },

  /**
   * Clear chat history (start fresh)
   */
  async clearHistory() {
    const response = await api.delete('/chatbot/history');
    return response.data;
  },

  /**
   * Get role-based quick action suggestions
   * @returns {{ label, message }[]}
   */
  async getSuggestions() {
    const response = await api.get('/chatbot/suggestions');
    return response.data;
  },
};

export default chatbotService;
