import { create } from 'zustand';
import { authService } from '../services/authService';
import { setToken, setUser, removeToken, removeUser } from '../utils/storage.utils';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isInitializing: true,
  isLoading: false,
  error: null,

  // Login
  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const { token, user, company } = await authService.login(username, password);
      const userWithCompany = { ...user, company };

      // persist to local storage
      setToken(token);
      setUser(userWithCompany);

      set({
        user: userWithCompany,
        isAuthenticated: true,
        isInitializing: false,
        isLoading: false,
      });

      return { success: true };
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Login failed';
      set({
        error: errorMessage,
        isLoading: false,
        isAuthenticated: false,
        isInitializing: false,
      });
      return { success: false, error: errorMessage };
    }
  },

  // Register

register: async (userData) => {
  set({ isLoading: true, error: null });
  try {
    // Adjust payload for CEO role
    const payload = {
      username: userData.username,
      email: userData.email,
      password: userData.password,
      role: userData.role,
      companyName: userData.role === 'CEO' ? userData.companyName : undefined,
      companyEmail: userData.role === 'CEO' ? userData.email : undefined,
    };

    const { token, user, company } = await authService.register(payload);
    const userWithCompany = { ...user, company };

    // persist to local storage
    setToken(token);
    setUser(userWithCompany);

    set({
      user: userWithCompany,
      isAuthenticated: true,
      isInitializing: false,
      isLoading: false,
    });

    return { success: true };
  } catch (err) {
    const errorMessage =
      err.response?.data?.message ||
      err.response?.data?.error ||
      err.message ||
      'Registration failed';
    set({
      error: errorMessage,
      isLoading: false,
      isAuthenticated: false,
      isInitializing: false,
    });
    return { success: false, error: errorMessage };
  }
},



  // Logout
  logout: async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      removeToken();
      removeUser();
      set({ user: null, isAuthenticated: false, error: null });
    }
  },

  // Check auth on page load
  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ isAuthenticated: false, user: null, isInitializing: false, isLoading: false });
      return;
    }

    set({ isInitializing: true, isLoading: true });

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
    } catch (err) {
      removeToken();
      removeUser();
      set({ user: null, isAuthenticated: false, isInitializing: false, isLoading: false });
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}));

export default useAuthStore;
