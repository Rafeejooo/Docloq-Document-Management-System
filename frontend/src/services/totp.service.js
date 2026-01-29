// src/services/totp.service.js
import api from './api';

export const totpService = {
  /**
   * Get 2FA status
   */
  async getStatus() {
    try {
      const response = await api.get('/totp/status');
      return response.data;
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to get 2FA status' 
      };
    }
  },

  /**
   * Generate TOTP secret and QR code
   */
  async generateSecret() {
    try {
      const response = await api.post('/totp/generate');
      return response.data;
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to generate 2FA secret' 
      };
    }
  },

  /**
   * Enable 2FA
   */
  async enable(code) {
    try {
      const response = await api.post('/totp/enable', { code });
      return response.data;
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to enable 2FA' 
      };
    }
  },

  /**
   * Disable 2FA
   */
  async disable(code) {
    try {
      const response = await api.post('/totp/disable', { code });
      return response.data;
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to disable 2FA' 
      };
    }
  },

  /**
   * Send Email OTP
   */
  async sendEmailOTP(userId) {
    try {
      const response = await api.post('/totp/send-email-otp', { userId });
      return response.data;
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to send email OTP' 
      };
    }
  },

  /**
   * Verify Email OTP
   */
  async verifyEmailOTP(userId, code) {
    try {
      const response = await api.post('/totp/verify-email-otp', { userId, code });
      return response.data;
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to verify email OTP' 
      };
    }
  },
};

export default totpService;
