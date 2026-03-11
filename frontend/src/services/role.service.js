// src/services/role.service.js
import api from './api';

const roleService = {
  /**
   * Get all custom roles for the organization
   */
  async getRoles() {
    try {
      const response = await api.get('/roles');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch roles' };
    }
  },

  /**
   * Get single role by ID
   */
  async getRoleById(id) {
    try {
      const response = await api.get(`/roles/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch role' };
    }
  },

  /**
   * Create a new role
   */
  async createRole(roleData) {
    try {
      const response = await api.post('/roles', roleData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create role' };
    }
  },

  /**
   * Update an existing role
   */
  async updateRole(id, roleData) {
    try {
      const response = await api.put(`/roles/${id}`, roleData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update role' };
    }
  },

  /**
   * Delete a role
   */
  async deleteRole(id) {
    try {
      const response = await api.delete(`/roles/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete role' };
    }
  },

  /**
   * Assign users to a role
   */
  async assignUsers(roleId, userIds) {
    try {
      const response = await api.post(`/roles/${roleId}/assign`, { userIds });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to assign users' };
    }
  },

  /**
   * Remove a user from a role
   */
  async removeUser(roleId, userId) {
    try {
      const response = await api.delete(`/roles/${roleId}/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to remove user' };
    }
  },

  /**
   * Get current user's permissions
   */
  async getMyPermissions() {
    try {
      const response = await api.get('/roles/my-permissions');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch permissions' };
    }
  },

  /**
   * Get a specific user's permissions (admin only)
   */
  async getUserPermissions(userId) {
    try {
      const response = await api.get(`/roles/user/${userId}/permissions`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch user permissions' };
    }
  },
};

export default roleService;
