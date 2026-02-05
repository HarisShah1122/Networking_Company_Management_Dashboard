import apiClient from './api/apiClient';
import { extractDataArray, extractData } from '../utils/apiResponseHelper';

export const complaintService = {
  // Get all complaints
  getAll: async (params = {}) => {
    const response = await apiClient.get('/complaints', { params });
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

  // Assign complaint to technician
  assignToTechnician: async (complaintId, technicianId) => {
    const response = await apiClient.post(`/complaints/${complaintId}/assign`, { technicianId });
    return extractData(response);
  },

  // Get SLA statistics
  getSLAStats: async (areaId = null) => {
    const params = areaId ? { areaId } : {};
    const response = await apiClient.get('/complaints/sla-stats', { params });
    return extractData(response);
  },
};