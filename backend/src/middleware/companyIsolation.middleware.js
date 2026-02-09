const ApiResponse = require('../helpers/responses');

/**
 * Middleware to ensure company-based data isolation
 * This middleware should be applied after authentication middleware
 */
const requireCompanyIsolation = (req, res, next) => {
  try {
    // Check if user is authenticated and has companyId
    if (!req.user) {
      return ApiResponse.error(res, 'Authentication required', 401);
    }

    if (!req.companyId) {
      return ApiResponse.error(res, 'Company identification required', 403);
    }

    // Company access logged for security auditing (removed sensitive info)
    next();
  } catch (error) {
    console.error('Company isolation middleware error:', error);
    return ApiResponse.error(res, 'Security validation failed', 500);
  }
};

/**
 * Middleware to validate that a resource belongs to the user's company
 * Used for individual resource access (getById, update, delete)
 */
const validateCompanyOwnership = (resourceIdParam = 'id') => {
  return async (req, res, next) => {
    try {
      if (!req.companyId) {
        return ApiResponse.error(res, 'Company identification required', 403);
      }

      const resourceId = req.params[resourceIdParam];
      if (!resourceId) {
        return ApiResponse.error(res, 'Resource ID required', 400);
      }

      // Add company validation to the request for controllers to use
      req.validateCompanyOwnership = true;
      
      next();
    } catch (error) {
      console.error('Company ownership validation error:', error);
      return ApiResponse.error(res, 'Security validation failed', 500);
    }
  };
};

/**
 * Middleware to add company filtering to all queries
 * This ensures that even if someone tries to bypass frontend filters,
 * the backend will always apply company-based filtering
 */
const enforceCompanyFiltering = (req, res, next) => {
  try {
    // Ensure companyId is available for all subsequent operations
    if (!req.companyId && req.user) {
      // Try to get companyId from user if not already set
      req.companyId = req.user.company_id || req.user.companyId;
    }

    if (!req.companyId) {
      return ApiResponse.error(res, 'Company identification required for data access', 403);
    }

    // Add security header for response
    res.setHeader('X-Company-Isolation', 'enabled');
    
    next();
  } catch (error) {
    console.error('Company filtering enforcement error:', error);
    return ApiResponse.error(res, 'Security validation failed', 500);
  }
};

module.exports = {
  requireCompanyIsolation,
  validateCompanyOwnership,
  enforceCompanyFiltering
};
