// src/services/user.service.js
import api from './api';

const userService = {
  /**
   * Get all users with pagination and filters
   */
  async getUsers(params = {}) {
    try {
      const response = await api.get('/users', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch users' };
    }
  },

  /**
   * Get single user by ID
   */
  async getUserById(id) {
    try {
      const response = await api.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch user' };
    }
  },

  /**
   * Create new user
   */
  async createUser(userData) {
    try {
      const response = await api.post('/users', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create user' };
    }
  },

  /**
   * Update user
   */
  async updateUser(id, userData) {
    try {
      const response = await api.put(`/users/${id}`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update user' };
    }
  },

  /**
   * Delete user
   */
  async deleteUser(id) {
    try {
      const response = await api.delete(`/users/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete user' };
    }
  },

  /**
   * Reset user password
   */
  async resetUserPassword(id, newPassword) {
    try {
      const response = await api.post(`/users/${id}/reset-password`, { newPassword });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to reset password' };
    }
  },

  /**
   * Toggle user active status
   */
  async toggleUserStatus(id) {
    try {
      const response = await api.patch(`/users/${id}/toggle-status`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to toggle user status' };
    }
  },
};

export default userService;
