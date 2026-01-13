const { validationResult } = require('express-validator');
const CustomerService = require('../services/customer.service');
const activityLogService = require('../services/activityLog.service');
const ApiResponse = require('../helpers/responses');

const getAll = async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status || '',
      search: req.query.search || '',
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      areaId: req.query.areaId || null
    };

    const result = await CustomerService.getAll(filters);

    return ApiResponse.paginated(
      res,
      result.data,
      result.pagination,
      'Customers retrieved successfully'
    );
  } catch (error) {
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

    if (req.user?.id) {
      activityLogService.logActivity(
        req.user.id,
        'create',
        'customers',
        `Created customer: ${customer.name} (pace_user_id: ${customer.pace_user_id || 'N/A'})`
      );
    }

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

    if (req.user?.id) {
      activityLogService.logActivity(
        req.user.id,
        'update',
        'customers',
        `Updated customer: ${customer.name} (pace_user_id: ${customer.pace_user_id || 'N/A'})`
      );
    }

    return ApiResponse.success(res, { customer }, 'Customer updated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update
};