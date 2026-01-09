import apiClient from './api/apiClient';

export const transactionService = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.type) params.append('type', filters.type);
    if (filters.category) params.append('category', filters.category);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    const response = await apiClient.get(`/transactions?${params}`);
    return response.data;
  },
  getById: async (id) => {
    const response = await apiClient.get(`/transactions/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await apiClient.post('/transactions', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await apiClient.put(`/transactions/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await apiClient.delete(`/transactions/${id}`);
    return response.data;
  },
  getSummary: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    const response = await apiClient.get(`/transactions/summary?${params}`);
    return response.data;
  },
  getByCategory: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    const response = await apiClient.get(`/transactions/by-category?${params}`);
    return response.data;
  },
};

