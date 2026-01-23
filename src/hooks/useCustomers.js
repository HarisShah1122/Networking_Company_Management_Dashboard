import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { customerService } from '../services/customerService';
import { extractArrayFromResponse } from '../utils/dataHelpers';

export const useCustomers = () => {
  const [customers, setCustomers] = useState([]);

  const loadCustomers = useCallback(async () => {
    try {
      const response = await customerService.getAll();
      const customersList = extractArrayFromResponse(response, 'customers');
      const validCustomers = customersList.filter(customer => customer && customer.id);
      setCustomers(validCustomers);
      return validCustomers;
    } catch (error) {
      toast.error('Failed to load customers');
      setCustomers([]);
      return [];
    }
  }, []);

  return { customers, loadCustomers, setCustomers };
};

