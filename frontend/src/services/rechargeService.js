import apiClient from './api/apiClient';

export const rechargeService = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status && filters.status.trim()) params.append('status', filters.status);
    if (filters.customer_id) params.append('customer_id', filters.customer_id);
    const queryString = params.toString();
    const response = await apiClient.get(`/recharges${queryString ? `?${queryString}` : ''}`);
    return response.data.data ?? response.data;
  },
  getById: async (id) => {
    const response = await apiClient.get(`/recharges/${id}`);
    return response.data.data ?? response.data;
  },
  create: async (data) => {
    const response = await apiClient.post('/recharges', data);
    return response.data.data ?? response.data;
  },
  update: async (id, data) => {
    const response = await apiClient.put(`/recharges/${id}`, data);
    return response.data.data ?? response.data;
  },
  delete: async (id) => {
    const response = await apiClient.delete(`/recharges/${id}`);
    return response.data.data ?? response.data;
  },
  getDuePayments: async () => {
    const response = await apiClient.get('/recharges/due');
    return response.data.data ?? response.data;
  },
  getStats: async () => {
    const response = await apiClient.get('/recharges/stats');
    return response.data.data ?? response.data;
  },
};

