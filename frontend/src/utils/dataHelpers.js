export const extractArrayFromResponse = (response, resourceName = null) => {
  if (Array.isArray(response)) {
    return response;
  }
  
  if (resourceName) {
    if (response?.data?.[resourceName] && Array.isArray(response.data[resourceName])) {
      return response.data[resourceName];
    }
    if (response?.[resourceName] && Array.isArray(response[resourceName])) {
      return response[resourceName];
    }
  }
  
  if (response?.data && Array.isArray(response.data)) {
    return response.data;
  }
  
  return [];
};

export const enrichWithCustomerData = (items, customers, customerIdField = 'customer_id') => {
  if (!items || !Array.isArray(items) || customers.length === 0) {
    return items;
  }

  return items.map(item => {
    const customerId = item[customerIdField] || item.customerId;
    
    if (!customerId) {
      return {
        ...item,
        customer_name: item.customer_name ?? null,
        customer_phone: item.customer_phone ?? null
      };
    }

    const customer = customers.find(c => String(c.id) === String(customerId));
    
    if (customer) {
      return {
        ...item,
        customer_name: item.customer_name ?? customer.name ?? null,
        customer_phone: item.customer_phone ?? customer.whatsapp_number ?? customer.phone ?? null
      };
    }

    return {
      ...item,
      customer_name: item.customer_name ?? null,
      customer_phone: item.customer_phone ?? null
    };
  });
};

export const filterBySearch = (items, searchTerm, searchFields = ['name']) => {
  if (!searchTerm || !searchTerm.trim()) {
    return items;
  }

  const searchLower = searchTerm.toLowerCase();
  
  return items.filter(item => {
    return searchFields.some(field => {
      const value = item[field];
      if (!value) return false;
      return String(value).toLowerCase().includes(searchLower);
    });
  });
};

