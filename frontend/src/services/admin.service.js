// Admin Authentication Service

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const adminService = {
  // Admin Login - Step 1: Verify credentials
  login: async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Admin login error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  },

  // Admin Login - Step 2: Verify OTP
  verifyOTP: async (adminId, code) => {
    try {
      const response = await fetch(`${API_URL}/admin/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminId, code }),
      });

      const data = await response.json();

      if (data.success) {
        // Store admin tokens
        localStorage.setItem('adminToken', data.data.accessToken);
        localStorage.setItem('adminRefreshToken', data.data.refreshToken);
        localStorage.setItem('adminUser', JSON.stringify(data.data.admin));
      }

      return data;
    } catch (error) {
      console.error('Admin verify OTP error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  },

  // Resend OTP
  resendOTP: async (adminId) => {
    try {
      const response = await fetch(`${API_URL}/admin/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminId }),
      });

      return await response.json();
    } catch (error) {
      console.error('Admin resend OTP error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  },

  // Admin Logout
  logout: async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      await fetch(`${API_URL}/admin/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminRefreshToken');
      localStorage.removeItem('adminUser');

      return { success: true };
    } catch (error) {
      console.error('Admin logout error:', error);
      // Clear local storage anyway
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminRefreshToken');
      localStorage.removeItem('adminUser');
      return { success: true };
    }
  },

  // Get Admin Profile
  getMe: async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch(`${API_URL}/admin/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      return await response.json();
    } catch (error) {
      console.error('Get admin profile error:', error);
      return {
        success: false,
        message: 'Network error',
      };
    }
  },

  // Get Dashboard Stats
  getDashboardStats: async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch(`${API_URL}/admin/dashboard/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      return await response.json();
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      return {
        success: false,
        message: 'Network error',
      };
    }
  },

  // Get All Users
  getUsers: async (params = {}) => {
    try {
      const token = localStorage.getItem('adminToken');
      const queryString = new URLSearchParams(params).toString();
      
      const response = await fetch(`${API_URL}/admin/users?${queryString}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      return await response.json();
    } catch (error) {
      console.error('Get users error:', error);
      return {
        success: false,
        message: 'Network error',
      };
    }
  },

  // Get All Organizations
  getOrganizations: async (params = {}) => {
    try {
      const token = localStorage.getItem('adminToken');
      const queryString = new URLSearchParams(params).toString();
      
      const response = await fetch(`${API_URL}/admin/organizations?${queryString}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      return await response.json();
    } catch (error) {
      console.error('Get organizations error:', error);
      return {
        success: false,
        message: 'Network error',
      };
    }
  },

  // Get Payment History
  getPayments: async (params = {}) => {
    try {
      const token = localStorage.getItem('adminToken');
      const queryString = new URLSearchParams(params).toString();
      
      const response = await fetch(`${API_URL}/admin/payments?${queryString}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      return await response.json();
    } catch (error) {
      console.error('Get payments error:', error);
      return {
        success: false,
        message: 'Network error',
      };
    }
  },

  // Get Recent Activity
  getRecentActivity: async (limit = 50) => {
    try {
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch(`${API_URL}/admin/activity?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      return await response.json();
    } catch (error) {
      console.error('Get recent activity error:', error);
      return {
        success: false,
        message: 'Network error',
      };
    }
  },

  // Update User Status
  updateUserStatus: async (userId, isActive) => {
    try {
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch(`${API_URL}/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      });

      return await response.json();
    } catch (error) {
      console.error('Update user status error:', error);
      return {
        success: false,
        message: 'Network error',
      };
    }
  },

  // Get Audit Logs
  getAuditLogs: async (params = {}) => {
    try {
      const token = localStorage.getItem('adminToken');
      const queryString = new URLSearchParams(params).toString();
      
      const response = await fetch(`${API_URL}/admin/audit-logs?${queryString}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      return await response.json();
    } catch (error) {
      console.error('Get audit logs error:', error);
      return {
        success: false,
        message: 'Network error',
      };
    }
  },

  // Get Blockchain Stats
  getBlockchainStats: async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch(`${API_URL}/admin/blockchain/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      return await response.json();
    } catch (error) {
      console.error('Get blockchain stats error:', error);
      return {
        success: false,
        message: 'Network error',
      };
    }
  },

  // Get Blockchain Transactions
  getBlockchainTransactions: async (params = {}) => {
    try {
      const token = localStorage.getItem('adminToken');
      const queryString = new URLSearchParams(params).toString();
      
      const response = await fetch(`${API_URL}/admin/blockchain/transactions?${queryString}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      return await response.json();
    } catch (error) {
      console.error('Get blockchain transactions error:', error);
      return {
        success: false,
        message: 'Network error',
      };
    }
  },

  // Update Blockchain Wallet Config
  updateWalletConfig: async (walletData) => {
    try {
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch(`${API_URL}/admin/blockchain/wallet`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(walletData),
      });

      return await response.json();
    } catch (error) {
      console.error('Update wallet config error:', error);
      return {
        success: false,
        message: 'Network error',
      };
    }
  },

  // Check if admin is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('adminToken');
    const adminUser = localStorage.getItem('adminUser');
    return !!(token && adminUser);
  },

  // Get current admin user
  getCurrentAdmin: () => {
    const adminUser = localStorage.getItem('adminUser');
    return adminUser ? JSON.parse(adminUser) : null;
  },
};

export default adminService;
