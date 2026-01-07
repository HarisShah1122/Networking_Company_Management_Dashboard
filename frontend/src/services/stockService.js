import apiClient from './api/apiClient';

export const stockService = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.search) params.append('search', filters.search);
    const response = await apiClient.get(`/stock?${params}`);
    return response.data;
  },
  getById: async (id) => {
    const response = await apiClient.get(`/stock/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await apiClient.post('/stock', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await apiClient.put(`/stock/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await apiClient.delete(`/stock/${id}`);
    return response.data;
  },
  getCategories: async () => {
    const response = await apiClient.get('/stock/categories');
    return response.data;
  },
  getStats: async () => {
    const response = await apiClient.get('/stock/stats');
    return response.data;
  },
};

