import apiClient from './api/apiClient';

export const authService = {
  login: async (username, password, role, companyId) => {
    const response = await apiClient.post('/auth/login', { username, password, role, companyId });
    const data = response?.data?.data;

    if (!data || !data.token || !data.user) {
      throw new Error('Invalid response from server'); // Only throw if token/user missing
    }

    return {
      token: data.token,
      user: data.user,
      company: data.company || null,
    };
  },

  register: async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    const data = response?.data?.data;

    if (!data || !data.token || !data.user) {
      throw new Error('Invalid response from server');
    }

    return {
      token: data.token,
      user: data.user,
      company: data.company || null,
    };
  },

  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    const data = response?.data?.data;

    if (!data || !data.user) {
      throw new Error('Failed to fetch user');
    }

    return {
      user: data.user,
      company: data.company || null,
    };
  },
};
