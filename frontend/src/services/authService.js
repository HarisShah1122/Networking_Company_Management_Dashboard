import apiClient from './api/apiClient';

export const authService = {
  login: async (username, password) => {
    const res = await apiClient.post('/auth/login', {
      username,
      password,
    });

    return res.data.data; // { user, company }
  },

  register: async (data) => {
    const res = await apiClient.post('/auth/register', data);
    return res.data.data;
  },

  getMe: async () => {
    const res = await apiClient.get('/auth/me');
    return res.data.data;
  },

  logout: async () => {
    await apiClient.post('/auth/logout');
  },
};
