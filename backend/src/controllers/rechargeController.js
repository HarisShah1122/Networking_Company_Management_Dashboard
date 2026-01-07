const { validationResult } = require('express-validator');
const RechargeService = require('../services/recharge.service');
const ActivityLogService = require('../services/activityLog.service');
const ApiResponse = require('../helpers/responses');
const { validateRecharge } = require('../helpers/validators');

class RechargeController {
  static async getAll(req, res, next) {
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
  }

  static async getById(req, res, next) {
    try {
      const recharge = await RechargeService.getById(req.params.id);
      
      if (!recharge) {
        return ApiResponse.notFound(res, 'Recharge');
      }

      return ApiResponse.success(res, { recharge }, 'Recharge retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ApiResponse.validationError(res, errors.array());
      }

      const recharge = await RechargeService.create(req.body);
      
      // Log activity (non-blocking)
      ActivityLogService.logActivity(
        req.user.id,
        'create',
        'recharges',
        `Created recharge: $${recharge.amount}`
      );

      return ApiResponse.success(res, { recharge }, 'Recharge created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ApiResponse.validationError(res, errors.array());
      }

      const recharge = await RechargeService.update(req.params.id, req.body);
      
      if (!recharge) {
        return ApiResponse.notFound(res, 'Recharge');
      }

      // Log activity (non-blocking)
      ActivityLogService.logActivity(
        req.user.id,
        'update',
        'recharges',
        `Updated recharge: $${recharge.amount}`
      );

      return ApiResponse.success(res, { recharge }, 'Recharge updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getDuePayments(req, res, next) {
    try {
      const duePayments = await RechargeService.getDuePayments();
      return ApiResponse.success(res, { duePayments }, 'Due payments retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getStats(req, res, next) {
    try {
      const stats = await RechargeService.getStats();
      return ApiResponse.success(res, { stats }, 'Statistics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = {
  getAll: RechargeController.getAll,
  getById: RechargeController.getById,
  create: RechargeController.create,
  update: RechargeController.update,
  getDuePayments: RechargeController.getDuePayments,
  getStats: RechargeController.getStats,
  validateRecharge
};
