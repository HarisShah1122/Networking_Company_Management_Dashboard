import apiClient from './api/apiClient';
import { extractDataArray, extractData } from '../utils/apiResponseHelper';

// Default pagination settings
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 1000;

export const connectionService = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    
    // Add filter parameters
    if (filters.status && filters.status.trim()) params.append('status', filters.status);
    if (filters.customer_id) params.append('customer_id', filters.customer_id);
    
    // Add pagination parameters
    const limit = Math.min(Math.max(parseInt(filters.limit) || DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE);
    const offset = Math.max(parseInt(filters.offset) || 0, 0);
    
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());
    
    // Add sorting parameters
    if (filters.sort_by) params.append('sort_by', filters.sort_by);
    if (filters.sort_order) params.append('sort_order', filters.sort_order || 'DESC');
    
    // Add performance optimization flag
    if (filters.skip_enrichment) params.append('skip_enrichment', 'true');
    
    const queryString = params.toString();
    const url = `/connections${queryString ? `?${queryString}` : ''}`;
    
    console.log('🔗 Frontend making request to:', url);
    
    try {
      const response = await apiClient.get(url);
      const data = extractDataArray(response, 'connections');
      
      // Extract pagination metadata if available
      const pagination = response?.data?.pagination;
      const performance = response?.data?.performance;
      
      console.log('🔗 Frontend received:', {
        connectionCount: data.length,
        pagination,
        performance
      });
      
      return {
        connections: data.length > 0 ? data : (response?.data?.data?.connections ?? []),
        pagination,
        performance
      };
    } catch (error) {
      console.error('🔗 Frontend request failed:', error);
      
      // Enhanced error handling
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout. Please try again.');
      }
      
      if (error.response?.status === 503) {
        throw new Error('Service temporarily unavailable. Please try again later.');
      }
      
      if (error.response?.status === 500) {
        throw new Error('Server error. Please try again later.');
      }
      
      throw error;
    }
  },
  
  // New method for paginated fetching
  getPaginated: async (page = 1, pageSize = DEFAULT_PAGE_SIZE, filters = {}) => {
    const offset = (page - 1) * pageSize;
    return this.getAll({
      ...filters,
      limit: pageSize,
      offset
    });
  },
  
  // New method for infinite scroll
  getNextPage: async (currentConnections = [], pageSize = DEFAULT_PAGE_SIZE, filters = {}) => {
    const offset = currentConnections.length;
    const result = await this.getAll({
      ...filters,
      limit: pageSize,
      offset
    });
    
    return {
      connections: [...currentConnections, ...result.connections],
      pagination: result.pagination,
      hasMore: result.pagination?.hasNext || false
    };
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

