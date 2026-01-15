import { create } from 'zustand';
import { getToken, setToken, removeToken, getUser, setUser, removeUser } from '../utils/storage.utils';
import { authService } from '../services/authService';

const useAuthStore = create((set) => ({
  user: getUser(),
  token: getToken(),
  isAuthenticated: !!getToken(),
  isInitializing: true,
  isLoading: false,
  error: null,

  login: async (username, password, role, companyId) => {
    set({ isLoading: true, error: null });
    try {
      const { token, user, company } = await authService.login(username, password, role, companyId);

      const userWithCompany = { ...user, company };
      setToken(token);
      setUser(userWithCompany);
      set({
        user: userWithCompany,
        token,
        isAuthenticated: true,
        isLoading: false,
        isInitializing: false,
      });

      return { success: true };
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Login failed';
      set({ error: errorMessage, isLoading: false, isAuthenticated: false, isInitializing: false });
      return { success: false, error: errorMessage };
    }
  },

  logout: () => {
    removeToken();
    removeUser();
    set({ user: null, token: null, isAuthenticated: false, error: null });
  },

  checkAuth: async () => {
    set({ isInitializing: true, isLoading: true });
    const token = getToken();
    if (!token) {
      set({ isAuthenticated: false, user: null, isInitializing: false, isLoading: false });
      return;
    }

    try {
      const { user, company } = await authService.getMe();
      const userWithCompany = { ...user, company };
      setUser(userWithCompany);
      set({
        user: userWithCompany,
        isAuthenticated: true,
        isInitializing: false,
        isLoading: false,
      });
    } catch {
      removeToken();
      removeUser();
      set({ user: null, token: null, isAuthenticated: false, isInitializing: false, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
