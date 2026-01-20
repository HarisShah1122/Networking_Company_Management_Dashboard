import { create } from 'zustand';
import { getToken, setToken, removeToken, getUser, setUser, removeUser } from '../utils/storage.utils';
import { authService } from '../services/authService';

const initialUser = getUser();
const initialToken = getToken();

const useAuthStore = create((set) => ({
  user: initialUser,
  token: initialToken,
  isAuthenticated: !!initialToken,
  isInitializing: true,
  error: null,

  // Login
  login: async (username, password) => {
    try {
      const { token, user, company } = await authService.login(username, password);
      setToken(token);
      setUser({ ...user, company });
      set({ user: { ...user, company }, token, isAuthenticated: true, error: null });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Login failed';
      set({ error: message });
      return { success: false, error: message };
    }
  },

  // Register (NEW!)
  register: async (userData) => {
    try {
      const { token, user, company } = await authService.register(userData);
      setToken(token);
      setUser({ ...user, company });
      set({ user: { ...user, company }, token, isAuthenticated: true, error: null });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Registration failed';
      set({ error: message });
      return { success: false, error: message };
    }
  },
  

  // Logout
  logout: () => {
    removeToken();
    removeUser();
    set({ user: null, token: null, isAuthenticated: false, error: null });
  },

  clearError: () => set({ error: null }),

  // Check authentication on load
  checkAuth: async () => {
    const token = getToken();
    const user = getUser();

    if (token && user) {
      try {
        const { user: freshUser, company } = await authService.getMe();
        setUser({ ...freshUser, company });
        set({ user: { ...freshUser, company }, token, isAuthenticated: true, isInitializing: false });
      } catch {
        removeToken();
        removeUser();
        set({ user: null, token: null, isAuthenticated: false, isInitializing: false });
      }
    } else {
      set({ user: null, token: null, isAuthenticated: false, isInitializing: false });
    }
  },
}));

export default useAuthStore;
