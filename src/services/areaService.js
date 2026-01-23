import apiClient from './api/apiClient'; 
import { extractDataArray, extractData } from '../utils/apiResponseHelper';

export const areaService = {
  getAll: async () => {
    const response = await apiClient.get('/areas');
    return extractDataArray(response, 'areas');
  },

  getById: async (id) => {
    const response = await apiClient.get(`/areas/${id}`);
    return extractData(response);
  },

  create: async (data) => {
    const response = await apiClient.post('/areas', data);
    return extractData(response);
  },

  update: async (id, data) => {
    const response = await apiClient.put(`/areas/${id}`, data);
    return extractData(response);
  },


};
