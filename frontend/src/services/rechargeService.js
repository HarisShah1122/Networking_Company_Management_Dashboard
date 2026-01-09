import apiClient from './api/apiClient';

export const rechargeService = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.customer_id) params.append('customer_id', filters.customer_id);
    const response = await apiClient.get(`/recharges?${params}`);
    return response.data;
  },
  getById: async (id) => {
    const response = await apiClient.get(`/recharges/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await apiClient.post('/recharges', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await apiClient.put(`/recharges/${id}`, data);
    return response.data;
  },
  getDuePayments: async () => {
    const response = await apiClient.get('/recharges/due');
    return response.data;
  },
  getStats: async () => {
    const response = await apiClient.get('/recharges/stats');
    return response.data;
  },
};

