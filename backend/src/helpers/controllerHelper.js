const { validationResult } = require('express-validator');
const ApiResponse = require('./responses');
const activityLogService = require('../services/activityLog.service');

const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return ApiResponse.validationError(res, errors.array());
  }
  return null;
};

const handleAsyncError = (error, req, res, next) => {
  next(error);
};

const crudHandlers = {
  getAll: async (req, res, next, serviceMethod, resourceName, filters = {}) => {
    try {
      const data = await serviceMethod(filters);
      const responseKey = resourceName.endsWith('y') 
        ? resourceName.slice(0, -1) + 'ies' 
        : resourceName + 's';
      return ApiResponse.success(res, { [responseKey]: data }, `${resourceName} retrieved successfully`);
    } catch (error) {
      handleAsyncError(error, req, res, next);
    }
  },

  getById: async (req, res, next, serviceMethod, resourceName, idParam = 'id') => {
    try {
      const item = await serviceMethod(req.params[idParam]);
      
      if (!item) {
        return ApiResponse.notFound(res, resourceName);
      }

      return ApiResponse.success(res, { [resourceName.toLowerCase()]: item }, `${resourceName} retrieved successfully`);
    } catch (error) {
      handleAsyncError(error, req, res, next);
    }
  },

  create: async (req, res, next, serviceMethod, resourceName, logMessage, statusCode = 201) => {
    try {
      const validationError = handleValidation(req, res);
      if (validationError) return validationError;

      const item = await serviceMethod(req.body, req.user?.id);
      
      if (req.user?.id) {
        activityLogService.logActivity(
          req.user.id,
          'create',
          resourceName.toLowerCase() + 's',
          logMessage || `Created ${resourceName.toLowerCase()}: ${item.name || item.id}`
        );
      }

      return ApiResponse.success(res, { [resourceName.toLowerCase()]: item }, `${resourceName} created successfully`, statusCode);
    } catch (error) {
      handleAsyncError(error, req, res, next);
    }
  },

  update: async (req, res, next, serviceMethod, resourceName, logMessage, idParam = 'id') => {
    try {
      const validationError = handleValidation(req, res);
      if (validationError) return validationError;

      const item = await serviceMethod(req.params[idParam], req.body, req.user?.id);
      
      if (!item) {
        return ApiResponse.notFound(res, resourceName);
      }

      if (req.user?.id) {
        activityLogService.logActivity(
          req.user.id,
          'update',
          resourceName.toLowerCase() + 's',
          logMessage || `Updated ${resourceName.toLowerCase()}: ${item.name || item.id}`
        );
      }

      return ApiResponse.success(res, { [resourceName.toLowerCase()]: item }, `${resourceName} updated successfully`);
    } catch (error) {
      handleAsyncError(error, req, res, next);
    }
  },

  delete: async (req, res, next, getServiceMethod, deleteServiceMethod, resourceName, getNameField = 'name', idParam = 'id') => {
    try {
      const item = await getServiceMethod(req.params[idParam]);
      
      if (!item) {
        return ApiResponse.notFound(res, resourceName);
      }

      const itemName = item[getNameField] || item.id;
      const deleted = await deleteServiceMethod(req.params[idParam], req.user?.id);

      if (!deleted) {
        return ApiResponse.error(res, `Failed to delete ${resourceName.toLowerCase()}`, 500);
      }

      if (req.user?.id) {
        activityLogService.logActivity(
          req.user.id,
          'delete',
          resourceName.toLowerCase() + 's',
          `Deleted ${resourceName.toLowerCase()}: ${itemName}`
        );
      }

      return ApiResponse.success(res, null, `${resourceName} deleted successfully`);
    } catch (error) {
      handleAsyncError(error, req, res, next);
    }
  }
};

module.exports = {
  handleValidation,
  handleAsyncError,
  crudHandlers
};

