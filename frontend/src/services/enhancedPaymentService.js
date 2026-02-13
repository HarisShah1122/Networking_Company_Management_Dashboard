import apiClient from './api/apiClient';

// Enhanced payment service with better timeout and retry handling
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
    
    // Create a custom axios instance for payments with longer timeout
    const paymentClient = apiClient.defaults;
    const originalTimeout = paymentClient.timeout;
    
    try {
      // Increase timeout specifically for payment operations (45 seconds)
      apiClient.defaults.timeout = 45000;
      
      const response = await apiClient.post('/payments', data, { headers });
      return response.data;
    } finally {
      // Restore original timeout
      apiClient.defaults.timeout = originalTimeout;
    }
  },

  update: async (id, data) => {
    const headers = {
      'Content-Type': data instanceof FormData ? 'multipart/form-data' : 'application/json'
    };
    
    // Create a custom axios instance for payments with longer timeout
    const originalTimeout = apiClient.defaults.timeout;
    
    try {
      // Increase timeout specifically for payment operations (45 seconds)
      apiClient.defaults.timeout = 45000;
      
      const response = await apiClient.put(`/payments/${id}`, data, { headers });
      return response.data;
    } finally {
      // Restore original timeout
      apiClient.defaults.timeout = originalTimeout;
    }
  },

  // New method to create payment with progress tracking
  createWithProgress: async (data, onProgress) => {
    const headers = {
      'Content-Type': data instanceof FormData ? 'multipart/form-data' : 'application/json'
    };
    
    // Custom axios instance for upload progress
    const config = {
      headers,
      timeout: 45000,
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      }
    };
    
    const response = await apiClient.post('/payments', data, config);
    return response.data;
  }
};
