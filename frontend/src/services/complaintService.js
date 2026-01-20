import apiClient from './api/apiClient';
import { extractDataArray, extractData } from '../utils/apiResponseHelper';

export const complaintService = {
  // Get all complaints
  getAll: async () => {
    const response = await apiClient.get('/complaints');
    return extractDataArray(response, 'complaints');
  },

  // Get complaint by ID
  getById: async (id) => {
    const response = await apiClient.get(`/complaints/${id}`);
    return extractData(response);
  },

  // Create complaint
  create: async (data) => {
    const response = await apiClient.post('/complaints', data);
    return extractData(response);
  },

  // Update complaint
  update: async (id, data) => {
    const response = await apiClient.put(`/complaints/${id}`, data);
    return extractData(response);
  },

  // Delete complaint
  delete: async (id) => {
    const response = await apiClient.delete(`/complaints/${id}`);
    return extractData(response);
  },

  // Get statistics
  getStats: async () => {
    const response = await apiClient.get('/complaints/stats');
    return extractData(response);
  },
};