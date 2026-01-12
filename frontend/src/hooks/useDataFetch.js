import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';

export const useDataFetch = (fetchFunction, dependencies = []) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const isInitialMount = useRef(true);

  const loadData = useCallback(async (params = {}, isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setIsSearching(true);
      }
      
      const response = await fetchFunction(params);
      
      // Handle different response structures
      let dataList = [];
      if (Array.isArray(response)) {
        dataList = response;
      } else if (response?.data && Array.isArray(response.data)) {
        dataList = response.data;
      } else {
        // Try common property names
        const keys = Object.keys(response || {});
        const arrayKey = keys.find(key => Array.isArray(response[key]));
        if (arrayKey) {
          dataList = response[arrayKey];
        }
      }
      
      setData(dataList);
      return dataList;
    } catch (error) {
      const errorMsg = error.response?.data?.message ?? error.message ?? 'Failed to load data';
      toast.error(errorMsg);
      setData([]);
      return [];
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, [fetchFunction]);

  useEffect(() => {
    if (isInitialMount.current) {
      loadData({}, true);
      isInitialMount.current = false;
    }
  }, [loadData, ...dependencies]);

  return {
    data,
    loading,
    isSearching,
    loadData,
    setData,
  };
};

