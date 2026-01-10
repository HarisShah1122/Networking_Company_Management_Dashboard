export const extractDataArray = (response, resourceName = null) => {
  if (Array.isArray(response)) {
    return response;
  }
  
  if (resourceName) {
    if (response?.data?.data?.[resourceName] && Array.isArray(response.data.data[resourceName])) {
      return response.data.data[resourceName];
    }
    if (response?.data?.[resourceName] && Array.isArray(response.data[resourceName])) {
      return response.data[resourceName];
    }
    if (response?.[resourceName] && Array.isArray(response[resourceName])) {
      return response[resourceName];
    }
  }
  
  if (response?.data?.data && Array.isArray(response.data.data)) {
    return response.data.data;
  }
  
  if (response?.data && Array.isArray(response.data)) {
    return response.data;
  }
  
  return [];
};

export const extractData = (response) => {
  return response?.data?.data ?? response?.data ?? response;
};

