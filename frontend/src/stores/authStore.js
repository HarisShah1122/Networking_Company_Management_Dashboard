import { create } from 'zustand';
import { getToken, setToken, removeToken, getUser, setUser, removeUser } from '../utils/storage.utils';
import { authService } from '../services/authService';

const useAuthStore = create((set) => ({
  user: getUser(),
  token: getToken(),
  isAuthenticated: !!getToken(),
  error: null,

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

  logout: () => {
    removeToken();
    removeUser();
    set({ user: null, token: null, isAuthenticated: false, error: null });
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
