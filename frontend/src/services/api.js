// src/services/api.js
import axios from 'axios';
import useAuthStore from '../app/store/auth.store';

// API Base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const { refreshToken, setTokens, logout } = useAuthStore.getState();

      if (refreshToken) {
        try {
          // Try to refresh token
          const response = await axios.post(`${API_URL}/auth/refresh-token`, {
            refreshToken,
          });

          if (response.data.success) {
            const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data;
            setTokens(newAccessToken, newRefreshToken);

            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed, logout user
          logout();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token, logout
        logout();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
