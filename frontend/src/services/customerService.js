import apiClient from './api/apiClient';

export const customerService = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status && filters.status.trim()) params.append('status', filters.status);
    if (filters.search && filters.search.trim()) params.append('search', filters.search.trim());
    const queryString = params.toString();
    const response = await apiClient.get(`/customers${queryString ? `?${queryString}` : ''}`);
    return response.data.data || response.data;
  },
  getById: async (id) => {
    const response = await apiClient.get(`/customers/${id}`);
    return response.data.data || response.data;
  },
  create: async (data) => {
    const response = await apiClient.post('/customers', data);
    return response.data.data || response.data;
  },
  update: async (id, data) => {
    const response = await apiClient.put(`/customers/${id}`, data);
    return response.data.data || response.data;
  },
  delete: async (id) => {
    const response = await apiClient.delete(`/customers/${id}`);
    return response.data.data || response.data;
  },
  getStats: async () => {
    const response = await apiClient.get('/customers/stats');
    return response.data.data || response.data;
  },
};

