import { create } from 'zustand';
import { authService } from '../services/authService';
import { getUser, setUser, removeUser } from '../utils/storage.utils';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isInitializing: true,
  error: null,

  initialize: async () => {
    try {
      const storedUser = getUser();
      if (storedUser) {
        const { user, company } = await authService.getMe();
        setUser({ ...user, company });
        set({ user: { ...user, company }, isAuthenticated: true });
      }
    } catch {
      removeUser();
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isInitializing: false });
    }
  },

  login: async (username, password) => {
    try {
      const { user, company } = await authService.login(username, password);
      setUser({ ...user, company });
      set({ user: { ...user, company }, isAuthenticated: true, error: null });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      set({ error: message });
      return { success: false };
    }
  },

  logout: async () => {
    await authService.logout();
    removeUser();
    set({ user: null, isAuthenticated: false });
  },

  registerUser: async (payload) => {
    try {
      const { user, company } = await authService.register(payload);
      setUser({ ...user, company });
      set({ user: { ...user, company }, isAuthenticated: true, error: null });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      set({ error: message });
      return { success: false, error: message };
    }
  },

  clearError: () => set({ error: null }),
}));

useAuthStore.getState().initialize();

export default useAuthStore;
