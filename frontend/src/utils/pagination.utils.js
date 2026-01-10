export const transformBackendPagination = (backendPagination, options = {}) => {
  const { fallbackLimit = 10, fallbackPage = 1 } = options;
  
  // Return null if no pagination data
  if (!backendPagination || typeof backendPagination !== 'object') {
    return null;
  }
  
  return {
    currentPage: backendPagination.page ?? fallbackPage,
    totalPages: backendPagination.total_pages ?? 1,
    totalCount: backendPagination.total ?? 0,
    limit: backendPagination.limit ?? fallbackLimit,
  };
};

export const transformBackendPaginationWithFallback = (backendPagination, localPagination) => {
  if (backendPagination && typeof backendPagination === 'object') {
    return {
      currentPage: backendPagination.page ?? localPagination?.currentPage ?? 1,
      totalPages: backendPagination.total_pages ?? 1,
      totalCount: backendPagination.total ?? 0,
      limit: backendPagination.limit ?? localPagination?.limit ?? 10,
    };
  }
  
  // Fallback to local pagination if backend pagination is missing
  return {
    currentPage: localPagination?.currentPage ?? 1,
    totalPages: localPagination?.totalPages ?? 1,
    totalCount: localPagination?.totalCount ?? 0,
    limit: localPagination?.limit ?? 10,
  };
};

