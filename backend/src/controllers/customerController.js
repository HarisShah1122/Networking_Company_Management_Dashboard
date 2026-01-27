const { validationResult } = require('express-validator');
const CustomerService = require('../services/customer.service');
const activityLogService = require('../services/activityLog.service');
const ApiResponse = require('../helpers/responses');
const { sendCustomerWelcome } = require('../helpers/whatsappHelper');

const getAll = async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status || '',
      search: req.query.search || '',
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      area_id: req.query.area_id || null
    };

    const result = await CustomerService.getAll(filters, req.companyId);

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
    const customer = await CustomerService.getById(req.params.id, req.companyId);
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

    const customer = await CustomerService.create(req.body, req.companyId);

    // Send WhatsApp welcome message
    if (customer.whatsapp_number && customer.pace_user_id) {
      await sendCustomerWelcome(customer.name, customer.pace_user_id);
    }

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

    const customer = await CustomerService.update(req.params.id, req.body, req.companyId);
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

const getStats = async (req, res, next) => {
  try {
    const stats = await CustomerService.getStats(req.companyId); 
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
  getStats
};