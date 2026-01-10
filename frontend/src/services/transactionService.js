import apiClient from './api/apiClient';

export const transactionService = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.type && filters.type.trim()) params.append('type', filters.type);
    if (filters.category && filters.category.trim()) params.append('category', filters.category);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    const queryString = params.toString();
    const response = await apiClient.get(`/transactions${queryString ? `?${queryString}` : ''}`);
    return response.data.data ?? response.data;
  },
  getById: async (id) => {
    const response = await apiClient.get(`/transactions/${id}`);
    return response.data.data ?? response.data;
  },
  create: async (data) => {
    const response = await apiClient.post('/transactions', data);
    return response.data.data ?? response.data;
  },
  update: async (id, data) => {
    const response = await apiClient.put(`/transactions/${id}`, data);
    return response.data.data ?? response.data;
  },
  delete: async (id) => {
    const response = await apiClient.delete(`/transactions/${id}`);
    return response.data.data ?? response.data;
  },
  getSummary: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    const queryString = params.toString();
    const response = await apiClient.get(`/transactions/summary${queryString ? `?${queryString}` : ''}`);
    return response.data.data ?? response.data;
  },
  getByCategory: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    const queryString = params.toString();
    const response = await apiClient.get(`/transactions/by-category${queryString ? `?${queryString}` : ''}`);
    return response.data.data ?? response.data;
  },
};

