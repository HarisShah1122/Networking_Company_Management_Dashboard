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
          if (token && user) {
            setToken(token);
            setUser(user);
            set({ user, token, isAuthenticated: true, isLoading: false });
            return { success: true };
          } else {
            throw new Error('Invalid response from server');
          }
        } catch (error) {
          const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Login failed';
          set({ error: errorMessage, isLoading: false, isAuthenticated: false });
          return { success: false, error: errorMessage };
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const { token, user } = await authService.register(userData);
          if (token && user) {
            setToken(token);
            setUser(user);
            set({ user, token, isAuthenticated: true, isLoading: false });
            return { success: true };
          } else {
            throw new Error('Invalid response from server');
          }
        } catch (error) {
          let errorMessage = 'Registration failed';
          if (error.response?.status === 401 || error.response?.status === 403) {
            errorMessage = 'Registration requires CEO privileges. Please contact your administrator.';
          } else {
            errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Registration failed';
          }
          set({ error: errorMessage, isLoading: false, isAuthenticated: false });
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
          const response = await authService.getMe();
          // Backend returns { user: {...} } in the data object
          const user = response.user;
          if (user) {
            setUser(user);
            set({ user, isAuthenticated: true });
          } else {
            throw new Error('Invalid user data');
          }
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

