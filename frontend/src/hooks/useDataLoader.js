import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';

export const useDataLoader = (loadFunction, options = {}) => {
  const { onSuccess, onError, defaultData = [] } = options;
  const [data, setData] = useState(defaultData);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  const load = useCallback(async (...args) => {
    const isInitialLoad = args[args.length - 1] === true || args.length === 0;
    
    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setSearching(true);
      }

      const result = await loadFunction(...args);
      
      if (onSuccess) {
        onSuccess(result);
      } else {
        setData(result);
      }

      return result;
    } catch (error) {
      const errorMsg = error.response?.data?.message ?? error.message ?? 'Failed to load data';
      toast.error(errorMsg);
      
      if (onError) {
        onError(error);
      } else {
        setData(defaultData);
      }
      
      throw error;
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }, [loadFunction, onSuccess, onError, defaultData]);

  return { data, loading, searching, load, setData };
};

