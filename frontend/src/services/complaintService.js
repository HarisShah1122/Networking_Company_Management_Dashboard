import apiClient from './api/apiClient';
import { extractDataArray, extractData } from '../utils/apiResponseHelper';

export const complaintService = {
  getAll: async () => {
    const response = await apiClient.get('/complaints');
    const data = extractDataArray(response, 'complaints');
    return data.length > 0 ? data : (response?.data?.data?.complaints ?? []);
  },
  getById: async (id) => {
    const response = await apiClient.get(`/complaints/${id}`);
    return extractData(response);
  },
  create: async (data) => {
    const response = await apiClient.post('/complaints', data);
    return extractData(response);
  },
  update: async (id, data) => {
    const response = await apiClient.put(`/complaints/${id}`, data);
    return extractData(response);
  },
  delete: async (id) => {
    const response = await apiClient.delete(`/complaints/${id}`);
    return extractData(response);
  },
};

