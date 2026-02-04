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
      console.log('🔐 Initializing auth store...');
      const storedUser = getUser();
      console.log('📝 Stored user:', storedUser);
      
      if (storedUser) {
        set({ user: storedUser, isAuthenticated: true });
        
        // Verify session is still valid
        try {
          console.log('🔍 Verifying session with backend...');
          const { user } = await authService.getMe();
          console.log('✅ Session valid, user:', user);
          set({ user, isAuthenticated: true });
        } catch (error) {
          console.warn('❌ Session invalid:', error);
          removeUser();
          set({ user: null, isAuthenticated: false });
        }
      }
    } catch (error) {
      console.error('❌ Auth initialization error:', error);
      removeUser();
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isInitializing: false });
      console.log('🏁 Auth initialization complete');
    }
  },

  login: async (username, password) => {
    try {
      const { user, company } = await authService.login(username, password);
      setUser({ ...user, company });
      set({ user: { ...user, company }, isAuthenticated: true, error: null });
      return { success: true };
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
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with local cleanup even if API call fails
    } finally {
      removeUser();
      set({ user: null, isAuthenticated: false });
    }
  },

  registerUser: async (payload) => {
    try {
      const { user, company } = await authService.register(payload);
      setUser({ ...user, company });
      set({ user: { ...user, company }, isAuthenticated: true, error: null });
      return { success: true };
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
