import apiClient from './api/apiClient';

export const connectionService = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status && filters.status.trim()) params.append('status', filters.status);
    if (filters.customer_id) params.append('customer_id', filters.customer_id);
    const queryString = params.toString();
    const response = await apiClient.get(`/connections${queryString ? `?${queryString}` : ''}`);
    return response.data.data ?? response.data;
  },
  getById: async (id) => {
    const response = await apiClient.get(`/connections/${id}`);
    return response.data.data ?? response.data;
  },
  create: async (data) => {
    const response = await apiClient.post('/connections', data);
    return response.data.data ?? response.data;
  },
  update: async (id, data) => {
    const response = await apiClient.put(`/connections/${id}`, data);
    return response.data.data ?? response.data;
  },
  delete: async (id) => {
    const response = await apiClient.delete(`/connections/${id}`);
    return response.data.data ?? response.data;
  },
  getStats: async () => {
    const response = await apiClient.get('/connections/stats');
    return response.data.data ?? response.data;
  },
};

