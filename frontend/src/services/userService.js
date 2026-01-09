import apiClient from './api/apiClient';

export const userService = {
  getAll: async () => {
    const response = await apiClient.get('/users');
    return response.data;
  },
  getById: async (id) => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await apiClient.post('/users', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await apiClient.put(`/users/${id}`, data);
    return response.data;
  },
};

