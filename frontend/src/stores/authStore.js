import { create } from 'zustand';
import { getToken, setToken, removeToken, getUser, setUser, removeUser } from '../utils/storage.utils';
import { authService } from '../services/authService';

const useAuthStore = create((set, get) => {
  // Initialize from localStorage
  const initState = {
    user: getUser(),
    token: getToken(),
    isAuthenticated: !!getToken(),
    isLoading: false,
    error: null,
  };

  return {
    ...initState,

    login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { token, user } = await authService.login(email, password);
          setToken(token);
          setUser(user);
          set({ user, token, isAuthenticated: true, isLoading: false });
          return { success: true };
        } catch (error) {
          const errorMessage = error.response?.data?.error || 'Login failed';
          set({ error: errorMessage, isLoading: false });
          return { success: false, error: errorMessage };
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const { token, user } = await authService.register(userData);
          setToken(token);
          setUser(user);
          set({ user, token, isAuthenticated: true, isLoading: false });
          return { success: true };
        } catch (error) {
          const errorMessage = error.response?.data?.error || 'Registration failed';
          set({ error: errorMessage, isLoading: false });
          return { success: false, error: errorMessage };
        }
      },

      logout: () => {
        removeToken();
        removeUser();
        set({ user: null, token: null, isAuthenticated: false, error: null });
      },

      checkAuth: async () => {
        const token = getToken();
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        try {
          const { user } = await authService.getMe();
          setUser(user);
          set({ user, isAuthenticated: true });
        } catch (error) {
          removeToken();
          removeUser();
          set({ isAuthenticated: false, user: null, token: null });
        }
      },

      clearError: () => set({ error: null }),
  };
});

export default useAuthStore;

