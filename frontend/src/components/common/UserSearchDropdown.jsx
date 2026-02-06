import React, { useState, useEffect, useRef, useCallback } from 'react';
import { customerService } from '../../services/customerService';

// Custom debounce function
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

const UserSearchDropdown = ({ 
  value, 
  onChange, 
  onCustomerSelect, 
  error, 
  placeholder = "Search user by name, PACE ID, phone...",
  className = ""
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (term) => {
      if (!term.trim()) {
        setSearchResults([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await customerService.getAll({ search: term.trim(), limit: 20 });
        const customers = response.data || [];
        setSearchResults(customers);
      } catch (error) {
        console.error('Error searching customers:', error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  // Handle search input change
  const handleInputChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    setIsOpen(true);
    setLoading(true);
    
    // Clear selected customer if user starts typing
    if (selectedCustomer) {
      setSelectedCustomer(null);
      onChange('');
      onCustomerSelect(null);
    }
    
    debouncedSearch(term);
  };

  // Handle customer selection
  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setSearchTerm(`${customer.name} ${customer.pace_user_id ? `(PACE: ${customer.pace_user_id})` : ''}`);
    onChange(customer.id);
    onCustomerSelect(customer);
    setIsOpen(false);
    setSearchResults([]);
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (!selectedCustomer && searchTerm) {
      setIsOpen(true);
    }
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clear selection
  const handleClear = () => {
    setSelectedCustomer(null);
    setSearchTerm('');
    onChange('');
    onCustomerSelect(null);
    setIsOpen(false);
    setSearchResults([]);
    inputRef.current?.focus();
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        
        {/* Clear button */}
        {searchTerm && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        
        {/* Loading indicator */}
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
          </div>
        )}
      </div>

      {/* Dropdown results */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {loading ? (
            <div className="px-4 py-3 text-center text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mx-auto"></div>
              <div className="text-sm mt-1">Searching...</div>
            </div>
          ) : searchResults.length > 0 ? (
            searchResults.map((customer) => (
              <div
                key={customer.id}
                onClick={() => handleCustomerSelect(customer)}
                className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {customer.name}
                    </div>
                    {customer.pace_user_id && (
                      <div className="text-sm text-gray-500">
                        PACE ID: {customer.pace_user_id}
                      </div>
                    )}
                    {customer.phone && (
                      <div className="text-sm text-gray-500">
                        📱 {customer.phone}
                      </div>
                    )}
                    {customer.address && (
                      <div className="text-sm text-gray-500 truncate">
                        📍 {customer.address}
                      </div>
                    )}
                  </div>
                  <div className="ml-2 text-xs text-gray-400 whitespace-nowrap">
                    {customer.area?.name || customer.area_name || 'No Area'}
                  </div>
                </div>
              </div>
            ))
          ) : searchTerm ? (
            <div className="px-4 py-3 text-center text-gray-500">
              No customers found
            </div>
          ) : (
            <div className="px-4 py-3 text-center text-gray-500">
              Type to search customers
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  );
};

export default UserSearchDropdown;
