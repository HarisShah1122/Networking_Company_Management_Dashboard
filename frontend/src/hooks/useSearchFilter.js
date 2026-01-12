import { useState, useEffect, useRef, useCallback } from 'react';

export const useSearchFilter = (onSearch, delay = 500) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimer = useRef(null);

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (searchTerm) {
      setIsSearching(true);
    }

    debounceTimer.current = setTimeout(() => {
      if (onSearch) {
        onSearch(searchTerm);
      }
      setIsSearching(false);
    }, delay);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchTerm, delay, onSearch]);

  const resetSearch = useCallback(() => {
    setSearchTerm('');
    setIsSearching(false);
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    isSearching,
    resetSearch,
  };
};

