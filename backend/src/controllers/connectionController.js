const { validationResult } = require('express-validator');
const ConnectionService = require('../services/connection.service');
const activityLogService = require('../services/activityLog.service');
const ApiResponse = require('../helpers/responses');
const { validateConnection } = require('../helpers/validators');

const getAll = async (req, res, next) => {
  const startTime = Date.now();
  console.log('🔗 Connection controller called:', {
    query: req.query,
    companyId: req.companyId,
    user: req.user?.id
  });
  
  try {
    // Extract and validate query parameters
    const {
      status,
      customer_id,
      limit = 50,
      offset = 0,
      sort_by = 'created_at',
      sort_order = 'DESC',
      skip_enrichment = false
    } = req.query;

    // Validate pagination parameters
    const validLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 1000);
    const validOffset = Math.max(parseInt(offset) || 0, 0);
    
    // Validate sort parameters
    const allowedSortFields = ['id', 'customer_id', 'connection_type', 'status', 'created_at', 'updated_at', 'installation_date', 'activation_date'];
    const validSortBy = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
    const validSortOrder = ['ASC', 'DESC'].includes(sort_order?.toUpperCase()) ? sort_order.toUpperCase() : 'DESC';

    const filters = {
      status,
      customer_id,
      limit: validLimit,
      offset: validOffset,
      sort_by: validSortBy,
      sort_order: validSortOrder
    };

    console.log('🔗 Validated params:', { 
      limit: validLimit, 
      offset: validOffset, 
      sort_by: validSortBy, 
      sort_order: validSortOrder,
      skip_enrichment 
    });
    
    // Fetch connections and total count in parallel
    const [connections, totalCount] = await Promise.all([
      ConnectionService.getAll(filters, req.companyId, skip_enrichment === 'true'),
      ConnectionService.getCount(filters, req.companyId)
    ]);

    const totalTime = Date.now() - startTime;
    console.log('🔗 Connection controller completed in', totalTime, 'ms, returning', connections.length, 'of', totalCount, 'connections');
    
    // Performance monitoring
    if (totalTime > 3000) {
      console.warn('⚠️ Slow API call detected:', totalTime, 'ms for', connections.length, 'records');
    }

    // Build pagination metadata
    const pagination = {
      currentPage: Math.floor(validOffset / validLimit) + 1,
      pageSize: validLimit,
      totalCount,
      totalPages: Math.ceil(totalCount / validLimit),
      hasNext: validOffset + validLimit < totalCount,
      hasPrev: validOffset > 0
    };

    return ApiResponse.success(res, { 
      connections, 
      pagination,
      performance: {
        queryTime: totalTime,
        recordCount: connections.length
      }
    }, 'Connections retrieved successfully');
    
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error('🔗 Connection controller failed after', totalTime, 'ms:', error);
    
    // Enhanced error handling
    if (error.name === 'SequelizeConnectionError') {
      return res.status(503).json({
        error: 'Database connection failed',
        message: 'Unable to connect to database. Please try again later.',
        retryable: true
      });
    }
    
    if (error.name === 'SequelizeQueryError') {
      return res.status(500).json({
        error: 'Database query failed',
        message: 'Invalid query parameters provided.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    if (error.name === 'SequelizeDatabaseError') {
      return res.status(500).json({
        error: 'Database error',
        message: 'Database operation failed.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
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
