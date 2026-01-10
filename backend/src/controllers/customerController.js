const { validationResult } = require('express-validator');
const CustomerService = require('../services/customer.service');
const activityLogService = require('../services/activityLog.service');
const ApiResponse = require('../helpers/responses');
const { validateCustomer } = require('../helpers/validators');

const getAll = async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status ?? '',
      search: req.query.search ?? '',
      page: req.query.page ?? 1,
      limit: req.query.limit ?? 10
    };

    const result = await CustomerService.getAll(filters);
    return ApiResponse.paginated(res, result.data, result.pagination, 'Customers retrieved successfully');
  } catch (error) {
    // Log error for debugging but don't expose details to client
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching customers:', error.message);
    }
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const customer = await CustomerService.getById(req.params.id);
    
    if (!customer) {
      return ApiResponse.notFound(res, 'Customer');
    }

    return ApiResponse.success(res, { customer }, 'Customer retrieved successfully');
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

    const customer = await CustomerService.create(req.body);
    
    // Log activity (non-blocking)
    activityLogService.logActivity(
      req.user.id,
      'create',
      'customers',
      `Created customer: ${customer.name}`
    );

    return ApiResponse.success(res, { customer }, 'Customer created successfully', 201);
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

    const customer = await CustomerService.update(req.params.id, req.body);
    
    if (!customer) {
      return ApiResponse.notFound(res, 'Customer');
    }

    // Log activity (non-blocking)
    activityLogService.logActivity(
      req.user.id,
      'update',
      'customers',
      `Updated customer: ${customer.name}`
    );

    return ApiResponse.success(res, { customer }, 'Customer updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteCustomer = async (req, res, next) => {
  try {
    const customer = await CustomerService.getById(req.params.id);
    
    if (!customer) {
      return ApiResponse.notFound(res, 'Customer');
    }

    const customerName = customer.name;
    const deleted = await CustomerService.delete(req.params.id);

    if (!deleted) {
      return ApiResponse.error(res, 'Failed to delete customer', 500);
    }

    // Log activity (non-blocking)
    activityLogService.logActivity(
      req.user.id,
      'delete',
      'customers',
      `Deleted customer: ${customerName}`
    );

    return ApiResponse.success(res, null, 'Customer deleted successfully');
  } catch (error) {
    next(error);
  }
};

const getStats = async (req, res, next) => {
  try {
    const stats = await CustomerService.getStats();
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
  delete: deleteCustomer,
  getStats,
  validateCustomer
};
