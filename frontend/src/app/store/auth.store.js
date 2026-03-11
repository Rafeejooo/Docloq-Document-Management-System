// src/app/store/auth.store.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import roleService from '@/services/role.service';

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      pending2FA: false, // Track if waiting for 2FA verification
      permissions: null, // User's aggregated permissions from custom roles
      hasFullAccess: false, // Whether user has admin-level full access

      // Actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      
      setTokens: (accessToken, refreshToken) => set({ 
        accessToken, 
        refreshToken,
        isAuthenticated: !!accessToken,
      }),

      setLoading: (isLoading) => set({ isLoading }),
      
      setError: (error) => set({ error }),
      
      clearError: () => set({ error: null }),

      // Set pending 2FA state
      setPending2FA: (pending) => set({ pending2FA: pending }),

      // Fetch permissions from API
      fetchPermissions: async () => {
        try {
          const res = await roleService.getMyPermissions();
          set({
            permissions: res?.data?.permissions || {},
            hasFullAccess: res?.data?.hasFullAccess || false,
          });
        } catch (err) {
          console.error('Failed to fetch permissions:', err);
          set({ permissions: {}, hasFullAccess: false });
        }
      },

      // Login success
      loginSuccess: (data) => {
        set({
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          isAuthenticated: true,
          isLoading: false,
          error: null,
          pending2FA: false,
        });
        // Fetch permissions after login
        setTimeout(() => get().fetchPermissions(), 100);
      },

      // Logout
      logout: () => set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        pending2FA: false,
        permissions: null,
        hasFullAccess: false,
      }),

      // Update user
      updateUser: (userData) => set((state) => ({
        user: { ...state.user, ...userData },
      })),

      // Check if user has role
      hasRole: (roles) => {
        const { user } = get();
        if (!user) return false;
        if (typeof roles === 'string') {
          return user.role === roles;
        }
        return roles.includes(user.role);
      },

      // Check if user is admin
      isAdmin: () => {
        const { user } = get();
        return user?.role === 'admin' || user?.role === 'super_admin';
      },

      // Check if user can access a document
      canAccessDocument: (documentId) => {
        const { hasFullAccess, permissions, user } = get();
        if (user?.role === 'admin' || user?.role === 'super_admin' || hasFullAccess) return true;
        if (!permissions) return false;
        const key = `document:${documentId}`;
        return permissions[key] && permissions[key] !== 'none';
      },

      // Check if user can access a folder
      canAccessFolder: (folderId) => {
        const { hasFullAccess, permissions, user } = get();
        if (user?.role === 'admin' || user?.role === 'super_admin' || hasFullAccess) return true;
        if (!permissions) return false;
        const key = `folder:${folderId}`;
        return permissions[key] && permissions[key] !== 'none';
      },

      // Get permission level for a resource
      getPermissionLevel: (resourceType, resourceId) => {
        const { hasFullAccess, permissions, user } = get();
        if (user?.role === 'admin' || user?.role === 'super_admin' || hasFullAccess) return 'admin';
        if (!permissions) return 'none';
        return permissions[`${resourceType}:${resourceId}`] || 'none';
      },
    }),
    {
      name: 'docloq-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export { useAuthStore };
export default useAuthStore;
