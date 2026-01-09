import apiClient from './api/apiClient';

export const connectionService = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.customer_id) params.append('customer_id', filters.customer_id);
    const response = await apiClient.get(`/connections?${params}`);
    return response.data;
  },
  getById: async (id) => {
    const response = await apiClient.get(`/connections/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await apiClient.post('/connections', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await apiClient.put(`/connections/${id}`, data);
    return response.data;
  },
  getStats: async () => {
    const response = await apiClient.get('/connections/stats');
    return response.data;
  },
};

