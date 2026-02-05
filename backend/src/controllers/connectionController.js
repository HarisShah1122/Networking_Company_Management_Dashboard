const { validationResult } = require('express-validator');
const ConnectionService = require('../services/connection.service');
const activityLogService = require('../services/activityLog.service');
const ApiResponse = require('../helpers/responses');
const { validateConnection } = require('../helpers/validators');

const getAll = async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      customer_id: req.query.customer_id
    };

    const connections = await ConnectionService.getAll(filters, req.companyId);
    return ApiResponse.success(res, { connections }, 'Connections retrieved successfully');
  } catch (error) {
    // Log error for debugging but don't expose details to client
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching connections:', error.message);
    }
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const connection = await ConnectionService.getById(req.params.id, req.companyId);
    
    if (!connection) {
      return ApiResponse.notFound(res, 'Connection');
    }

    return ApiResponse.success(res, { connection }, 'Connection retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ApiResponse.validationError(res, errors.array());
    }

    const connection = await ConnectionService.create(req.body, req.companyId);
    
    // Log activity (non-blocking)
    activityLogService.logActivity(
      req.user.id,
      'create',
      'connections',
      `Created connection: ${connection.connection_type}`
    );

    return ApiResponse.success(res, { connection }, 'Connection created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ApiResponse.validationError(res, errors.array());
    }

    const connection = await ConnectionService.update(req.params.id, req.body, req.companyId);
    
    if (!connection) {
      return ApiResponse.notFound(res, 'Connection');
    }

    // Log activity (non-blocking)
    activityLogService.logActivity(
      req.user.id,
      'update',
      'connections',
      `Updated connection: ${connection.connection_type}`
    );

    return ApiResponse.success(res, { connection }, 'Connection updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteConnection = async (req, res, next) => {
  try {
    const connection = await ConnectionService.getById(req.params.id, req.companyId);
    
    if (!connection) {
      return ApiResponse.notFound(res, 'Connection');
    }

    const connectionType = connection.connection_type;
    const deleted = await ConnectionService.delete(req.params.id, req.companyId);

    if (!deleted) {
      return ApiResponse.error(res, 'Failed to delete connection', 500);
    }

    // Log activity (non-blocking)
    activityLogService.logActivity(
      req.user.id,
      'delete',
      'connections',
      `Deleted connection: ${connectionType}`
    );

    return ApiResponse.success(res, null, 'Connection deleted successfully');
  } catch (error) {
    next(error);
  }
};

const getStats = async (req, res, next) => {
  try {
    const stats = await ConnectionService.getStats(req.companyId);
    return ApiResponse.success(res, { stats }, 'Statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  delete: deleteConnection,
  getStats,
  validateConnection
};
