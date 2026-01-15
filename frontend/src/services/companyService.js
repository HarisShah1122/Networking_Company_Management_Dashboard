import apiClient from './api/apiClient';

export const companyService = {
  getAll: async () => {
    const response = await apiClient.get('/companies');
    return response.data.data?.companies || response.data.companies || [];
  },

  getStats: async () => {
    const response = await apiClient.get('/companies/stats');
    return response.data.data || response.data;
  }
};

