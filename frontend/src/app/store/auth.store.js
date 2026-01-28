// src/app/store/auth.store.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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

      // Login success
      loginSuccess: (data) => set({
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        pending2FA: false,
      }),

      // Logout
      logout: () => set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        pending2FA: false,
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
