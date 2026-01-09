import apiClient from './api/apiClient';

export const authService = {
  login: async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password });
    // Backend returns { success, message, data: { token, user } }
    return response.data.data;
  },

  register: async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
  
    return response.data.data;
  },

  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    // Backend returns { success, message, data: { user } }
    return response.data.data || response.data;
  },
};

