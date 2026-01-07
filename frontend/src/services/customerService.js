import apiClient from './api/apiClient';

export const customerService = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    const response = await apiClient.get(`/customers?${params}`);
    return response.data;
  },
  getById: async (id) => {
    const response = await apiClient.get(`/customers/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await apiClient.post('/customers', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await apiClient.put(`/customers/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await apiClient.delete(`/customers/${id}`);
    return response.data;
  },
  getStats: async () => {
    const response = await apiClient.get('/customers/stats');
    return response.data;
  },
};

