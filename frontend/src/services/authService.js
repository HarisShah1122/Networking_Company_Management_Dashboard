import apiClient from './api/apiClient';

export const authService = {
  login: async (username, password) => {
    // Send 'username' instead of 'email'
    const response = await apiClient.post('/auth/login', { username, password });
    // Backend returns { success, message, data: { token, user } }
    return response.data.data; 
  },

  register: async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    // Backend returns { success, message, data: { token, user } }
    return response.data.data;
  },

  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    // Backend returns { success, message, data: { user } }
    return response.data.data ?? response.data;
  },
};
