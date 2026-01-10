import apiClient from './api/apiClient';
import { extractDataArray, extractData } from '../utils/apiResponseHelper';

export const connectionService = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status && filters.status.trim()) params.append('status', filters.status);
    if (filters.customer_id) params.append('customer_id', filters.customer_id);
    const queryString = params.toString();
    const response = await apiClient.get(`/connections${queryString ? `?${queryString}` : ''}`);
    const data = extractDataArray(response, 'connections');
    return data.length > 0 ? data : (response?.data?.data?.connections ?? []);
  },
  getById: async (id) => {
    const response = await apiClient.get(`/connections/${id}`);
    return extractData(response);
  },
  create: async (data) => {
    const response = await apiClient.post('/connections', data);
    return extractData(response);
  },
  update: async (id, data) => {
    const response = await apiClient.put(`/connections/${id}`, data);
    return extractData(response);
  },
  delete: async (id) => {
    const response = await apiClient.delete(`/connections/${id}`);
    return extractData(response);
  },
  getStats: async () => {
    const response = await apiClient.get('/connections/stats');
    return extractData(response);
  },
};

