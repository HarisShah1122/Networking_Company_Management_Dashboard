const { validationResult } = require('express-validator');
const RechargeService = require('../services/recharge.service');
const ApiResponse = require('../helpers/responses');
const { validateRecharge } = require('../helpers/validators');

const getAll = async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      customer_id: req.query.customer_id
    };

    const recharges = await RechargeService.getAll(filters);
    return ApiResponse.success(res, { recharges }, 'Recharges retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const recharge = await RechargeService.getById(req.params.id);
    
    if (!recharge) {
      return ApiResponse.notFound(res, 'Recharge not found');
    }

    return ApiResponse.success(res, { recharge }, 'Recharge retrieved successfully');
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

    const recharge = await RechargeService.create(req.body);
    return ApiResponse.success(res, { recharge }, 'Recharge created successfully', 201);
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

    const recharge = await RechargeService.update(req.params.id, req.body);
    
    if (!recharge) {
      return ApiResponse.notFound(res, 'Recharge not found');
    }

    return ApiResponse.success(res, { recharge }, 'Recharge updated successfully');
  } catch (error) {
    next(error);
  }
};

const getDuePayments = async (req, res, next) => {
  try {
    const duePayments = await RechargeService.getDuePayments();
    return ApiResponse.success(res, { duePayments }, 'Due payments retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getStats = async (req, res, next) => {
  try {
    const stats = await RechargeService.getStats();
    return ApiResponse.success(res, { stats }, 'Statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getSummary = async (req, res, next) => {
  try {
    const summary = await RechargeService.getSummary();
    return ApiResponse.success(res, summary, 'Recharge summary retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  getDuePayments,
  getStats,
  getSummary,
};