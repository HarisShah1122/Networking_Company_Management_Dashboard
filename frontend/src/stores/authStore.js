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
          
          // Check for validation errors
          if (error.response?.data?.errors) {
            const errors = error.response.data.errors;
            errorMessage = Array.isArray(errors) 
              ? errors.map(e => typeof e === 'string' ? e : (e.msg || e.message || JSON.stringify(e))).join(', ')
              : errors;
          } 
          // Check for error message
          else if (error.response?.data?.message) {
            errorMessage = Array.isArray(error.response.data.message) 
              ? error.response.data.message.join(', ')
              : error.response.data.message;
          } 
          // Check for error field
          else if (error.response?.data?.error) {
            errorMessage = Array.isArray(error.response.data.error) 
              ? error.response.data.error.join(', ')
              : error.response.data.error;
          } 
          // Check for status text
          else if (error.response?.statusText) {
            errorMessage = error.response.statusText;
          }
          // Fallback to error message
          else if (error.message) {
            errorMessage = error.message;
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

