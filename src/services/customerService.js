import apiClient from './api/apiClient';

export const customerService = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status && filters.status.trim()) params.append('status', filters.status);
    if (filters.search && filters.search.trim()) params.append('search', filters.search.trim());
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    const queryString = params.toString();
    const response = await apiClient.get(`/customers${queryString ? `?${queryString}` : ''}`);
    const responseData = response.data;
    
    // Handle new paginated format: { success: true, data: [...], pagination: {...} }
    if (responseData?.data && Array.isArray(responseData.data)) {
      return {
        data: responseData.data,
        pagination: responseData.pagination ?? null
      };
    }
    
    // Handle old format: { success: true, data: { customers: [...] } }
    if (responseData?.data?.customers && Array.isArray(responseData.data.customers)) {
      return {
        data: responseData.data.customers,
        pagination: null
      };
    }
    
    // Handle old format: { customers: [...] }
    if (responseData?.customers && Array.isArray(responseData.customers)) {
      return {
        data: responseData.customers,
        pagination: null
      };
    }
    
    // Fallback: if responseData is directly an array
    if (Array.isArray(responseData)) {
      return {
        data: responseData,
        pagination: null
      };
    }
    
    return {
      data: [],
      pagination: null
    };
  },
  getById: async (id) => {
    const response = await apiClient.get(`/customers/${id}`);
    return response.data.data ?? response.data;
  },
  create: async (data) => {
    const response = await apiClient.post('/customers', data);
    return response.data.data ?? response.data;
  },
  update: async (id, data) => {
    const response = await apiClient.put(`/customers/${id}`, data);
    return response.data.data ?? response.data;
  },
  delete: async (id) => {
    const response = await apiClient.delete(`/customers/${id}`);
    return response.data.data ?? response.data;
  },
  getStats: async () => {
    const response = await apiClient.get('/customers/stats');
    return response.data.data ?? response.data;
  },
};

