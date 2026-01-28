// src/services/auth.service.js
import api from './api';
import useAuthStore from '../app/store/auth.store';

export const authService = {
  /**
   * Login user
   */
  async login(email, password, hcaptchaToken = null, rememberMe = false) {
    const { setLoading, setError, loginSuccess, setPending2FA } = useAuthStore.getState();
    
    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/auth/login', {
        email,
        password,
        hcaptchaToken,
        rememberMe,
      });

      if (response.data.success) {
        // Check if 2FA is required
        if (response.data.data.requires2FA) {
          // Set pending 2FA state - user is NOT authenticated yet
          setPending2FA(true);
          return { 
            success: true, 
            requires2FA: true,
            userId: response.data.data.userId,
            email: response.data.data.email
          };
        }
        
        // Normal login success (no 2FA)
        loginSuccess(response.data.data);
        return { success: true, data: response.data.data };
      }

      return { success: false, message: response.data.message };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      setError(message);
      return { 
        success: false, 
        message,
        attemptsRemaining: error.response?.data?.attemptsRemaining,
      };
    } finally {
      setLoading(false);
    }
  },

  /**
   * Register new user
   */
  async register(userData) {
    const { setLoading, setError, loginSuccess } = useAuthStore.getState();
    
    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/auth/register', userData);

      if (response.data.success) {
        loginSuccess(response.data.data);
        return { success: true, data: response.data.data };
      }

      return { success: false, message: response.data.message };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  },

  /**
   * Logout user
   */
  async logout() {
    const { logout } = useAuthStore.getState();
    
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Logout locally even if API fails
      console.error('Logout API error:', error);
    } finally {
      logout();
    }
  },

  /**
   * Get current user
   */
  async getMe() {
    const { setUser, setLoading, logout } = useAuthStore.getState();
    
    try {
      setLoading(true);
      const response = await api.get('/auth/me');

      if (response.data.success) {
        setUser(response.data.data.user);
        return { success: true, data: response.data.data };
      }

      return { success: false, message: response.data.message };
    } catch (error) {
      if (error.response?.status === 401) {
        logout();
      }
      return { success: false, message: error.response?.data?.message };
    } finally {
      setLoading(false);
    }
  },

  /**
   * Refresh token
   */
  async refreshToken() {
    const { refreshToken, setTokens, logout } = useAuthStore.getState();
    
    if (!refreshToken) {
      logout();
      return { success: false };
    }

    try {
      const response = await api.post('/auth/refresh-token', { refreshToken });

      if (response.data.success) {
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        setTokens(accessToken, newRefreshToken);
        return { success: true };
      }

      logout();
      return { success: false };
    } catch (error) {
      logout();
      return { success: false };
    }
  },

  /**
   * Verify TOTP code during login
   */
  async verifyTOTP(userId, code) {
    try {
      const response = await api.post('/totp/verify-login', { userId, code });
      return response.data;
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Verification failed' 
      };
    }
  },

  /**
   * Complete login after 2FA verification
   */
  async completeLogin(userId, rememberMe = false) {
    try {
      const response = await api.post('/auth/complete-login', { userId, rememberMe });
      return response.data;
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  },
};

export default authService;
