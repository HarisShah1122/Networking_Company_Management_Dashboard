import apiClient from './api/apiClient';
import { extractDataArray, extractData } from '../utils/apiResponseHelper';

export const externalComplaintService = {
  // Get all complaints with filtering
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.branch && filters.branch !== 'all') {
      params.append('branch', filters.branch);
    }
    if (filters.district && filters.district !== 'all') {
      params.append('district', filters.district);
    }
    if (filters.source && filters.source !== 'all') {
      params.append('source', filters.source);
    }

    const url = params.toString() ? `/external-complaints?${params}` : '/external-complaints';
    const response = await apiClient.get(url);
    return extractDataArray(response, 'complaints');
  },

  // Get complaint statistics
  getStats: async (filters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.branch && filters.branch !== 'all') {
      params.append('branch', filters.branch);
    }
    if (filters.district && filters.district !== 'all') {
      params.append('district', filters.district);
    }

    const url = params.toString() ? `/external-complaints/stats?${params}` : '/external-complaints/stats';
    const response = await apiClient.get(url);
    return extractData(response);
  },

  // Get branch configuration
  getBranches: async () => {
    const response = await apiClient.get('/external-complaints/branches');
    return extractData(response);
  },

  // Sync external complaints
  syncExternalComplaints: async () => {
    const response = await apiClient.post('/external-complaints/sync');
    return extractData(response);
  },

  // Create external complaint
  create: async (data) => {
    const response = await apiClient.post('/external-complaints', data);
    return extractData(response);
  }
};
