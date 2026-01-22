import apiClient from './api/apiClient';

export const paymentService = {
  getAll: async () => {
    const response = await apiClient.get('/payments');
    return response.data.payments ?? response.data.data ?? response.data ?? [];
  },

  getByCustomer: async (customerId) => {
    const response = await apiClient.get(`/payments/customer/${customerId}`);
    return response.data.payments ?? response.data.data ?? response.data ?? [];
  },

  create: async (data) => {
    const headers = {
      'Content-Type': data instanceof FormData ? 'multipart/form-data' : 'application/json'
    };
    const response = await apiClient.post('/payments', data, { headers });
    return response.data;
  },

  update: async (id, data) => {
    const headers = {
      'Content-Type': data instanceof FormData ? 'multipart/form-data' : 'application/json'
    };
    const response = await apiClient.put(`/payments/${id}`, data, { headers });
    return response.data;
  },
};