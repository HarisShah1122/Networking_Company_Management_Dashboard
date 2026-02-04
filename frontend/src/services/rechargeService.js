import apiClient from './api/apiClient';
import { extractDataArray, extractData } from '../utils/apiResponseHelper';

export const rechargeService = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status && filters.status.trim()) params.append('status', filters.status);
    if (filters.customer_id) params.append('customer_id', filters.customer_id);
    const queryString = params.toString();
    const response = await apiClient.get(`/recharges${queryString ? `?${queryString}` : ''}`);
    const data = extractDataArray(response, 'recharges');
    return data.length > 0 ? data : (response?.data?.data?.recharges ?? []);
  },
  getById: async (id) => {
    const response = await apiClient.get(`/recharges/${id}`);
    return extractData(response);
  },
  create: async (data) => {
    const response = await apiClient.post('/recharges', data);
    return extractData(response);
  },
  update: async (id, data) => {
    const response = await apiClient.put(`/recharges/${id}`, data);
    return extractData(response);
  },
  delete: async (id) => {
    const response = await apiClient.delete(`/recharges/${id}`);
    return extractData(response);
  },
  getDuePayments: async () => {
    const response = await apiClient.get('/recharges/due');
    return extractDataArray(response, 'recharges');
  },
  getSummary: async () => {
    try {
      const response = await apiClient.get('/recharges/summary');
      return response.data.data ?? response.data ?? { total_paid: 0, total_pending: 0 };
    } catch (error) {
      console.warn('Recharge summary failed, using fallback:', error);
      return { total_paid: 0, total_pending: 0 };
    }
  },
};