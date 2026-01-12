import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stockService } from '../../services/stockService';
import { toast } from 'react-toastify';

// Query keys
export const stockKeys = {
  all: ['stock'],
  lists: () => [...stockKeys.all, 'list'],
  list: (filters) => [...stockKeys.lists(), filters],
  details: () => [...stockKeys.all, 'detail'],
  detail: (id) => [...stockKeys.details(), id],
  categories: () => [...stockKeys.all, 'categories'],
};

// Fetch stock list
export const useStockList = (filters = {}) => {
  return useQuery({
    queryKey: stockKeys.list(filters),
    queryFn: async () => {
      const response = await stockService.getAll(filters);
      // Handle different response structures
      if (Array.isArray(response)) {
        return response;
      } else if (response?.stock && Array.isArray(response.stock)) {
        return response.stock;
      } else if (response?.data?.stock && Array.isArray(response.data.stock)) {
        return response.data.stock;
      } else if (response?.data && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    },
    enabled: true,
  });
};

// Fetch stock categories
export const useStockCategories = () => {
  return useQuery({
    queryKey: stockKeys.categories(),
    queryFn: async () => {
      const response = await stockService.getCategories();
      // Handle different response structures
      if (Array.isArray(response)) {
        return response;
      } else if (response?.categories && Array.isArray(response.categories)) {
        return response.categories;
      } else if (response?.data?.categories && Array.isArray(response.data.categories)) {
        return response.data.categories;
      } else if (response?.data && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    },
  });
};

// Create stock item mutation
export const useCreateStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => stockService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockKeys.lists() });
      toast.success('Stock item created successfully!');
    },
    onError: (error) => {
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to create stock item';
      toast.error(errorMsg);
    },
  });
};

// Update stock item mutation
export const useUpdateStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => stockService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockKeys.lists() });
      toast.success('Stock item updated successfully!');
    },
    onError: (error) => {
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to update stock item';
      toast.error(errorMsg);
    },
  });
};

// Delete stock item mutation
export const useDeleteStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => stockService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockKeys.lists() });
      toast.success('Stock item deleted successfully!');
    },
    onError: (error) => {
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to delete stock item';
      toast.error(errorMsg);
    },
  });
};

