import { create } from 'zustand';
import { authService } from '../services/authService';
import { getUser, setUser, getToken, setToken, clearAuth } from '../utils/storage.utils';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isInitializing: true,
  error: null,

  initialize: async () => {
    try {
      console.log('🔐 Initializing JWT auth store...');
      const token = getToken();
      const storedUser = getUser();
      
      console.log('� JWT token found:', token ? 'yes' : 'no');
      console.log('� Stored user:', storedUser);
      
      if (token && storedUser) {
        // Set authenticated state immediately from localStorage
        set({ user: storedUser, isAuthenticated: true });
        
        // Verify token is still valid with backend
        try {
          console.log('🔍 Verifying JWT token with backend...');
          const response = await authService.getMe();
          console.log('✅ JWT token valid, user:', response.user);
          
          // Update user data with fresh data from backend
          set({ user: response.user, isAuthenticated: true });
        } catch (error) {
          console.warn('❌ JWT token verification failed:', error.response?.status, error.message);
          
          // If token is invalid, clear everything
          clearAuth();
          set({ user: null, isAuthenticated: false });
          console.log('🔄 JWT token invalid - user will need to login again');
        }
      } else {
        console.log('📝 No JWT token or user found');
        set({ user: null, isAuthenticated: false });
      }
    } catch (error) {
      console.error('❌ JWT auth initialization error:', error);
      clearAuth();
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isInitializing: false });
      console.log('🏁 JWT auth initialization complete - isAuthenticated:', useAuthStore.getState().isAuthenticated);
    }
  },

  login: async (username, password) => {
    try {
      console.log('🔐 Attempting hybrid login (JWT + Session)...');
      const { token, user, company, authMethod } = await authService.login(username, password);
      
      // Store JWT token and user data
      if (token) {
        setToken(token);
        console.log('💾 JWT token stored');
      }
      
      setUser({ ...user, company });
      set({ user: { ...user, company }, isAuthenticated: true, error: null });
      
      console.log('✅ Hybrid login successful - Auth method:', authMethod);
      return { success: true, authMethod };
    } catch (err) {
      let message = 'Login failed';
      
      if (err.response?.data) {
        const data = err.response.data;
        
        // Handle validation errors (422)
        if (data.errors && Array.isArray(data.errors)) {
          message = data.errors.map(err => err.message).join(', ');
        } 
        // Handle regular error messages
        else if (data.message) {
          message = data.message;
        }
        // Handle error field
        else if (data.error) {
          message = data.error;
        }
      }
      
      set({ error: message });
      return { success: false };
    }
  },

  logout: async () => {
    try {
      console.log('🔐 Logging out...');
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with local cleanup even if API call fails
    } finally {
      clearAuth();
      set({ user: null, isAuthenticated: false });
      console.log('✅ JWT logout complete');
    }
  },

  registerUser: async (payload) => {
    try {
      console.log('🔐 Attempting hybrid registration (JWT + Session)...');
      const { token, user, company, authMethod } = await authService.register(payload);
      
      // Store JWT token and user data
      if (token) {
        setToken(token);
        console.log('💾 JWT token stored');
      }
      
      setUser({ ...user, company });
      set({ user: { ...user, company }, isAuthenticated: true, error: null });
      
      console.log('✅ Hybrid registration successful - Auth method:', authMethod);
      return { success: true, authMethod };
    } catch (err) {
      let message = 'Registration failed';
      
      if (err.response?.data) {
        const data = err.response.data;
        
        // Handle validation errors (422)
        if (data.errors && Array.isArray(data.errors)) {
          message = data.errors.map(err => err.message).join(', ');
        } 
        // Handle regular error messages
        else if (data.message) {
          message = data.message;
        }
        // Handle error field
        else if (data.error) {
          message = data.error;
        }
      }
      
      set({ error: message });
      return { success: false, error: message };
    }
  },

  clearError: () => set({ error: null }),
}));

useAuthStore.getState().initialize();

export default useAuthStore;
