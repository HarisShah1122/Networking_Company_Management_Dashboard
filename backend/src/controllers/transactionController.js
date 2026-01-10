const { validationResult } = require('express-validator');
const TransactionService = require('../services/transaction.service');
const ActivityLogService = require('../services/activityLog.service');
const ApiResponse = require('../helpers/responses');
const { validateTransaction } = require('../helpers/validators');

const getAll = async (req, res, next) => {
  try {
    const filters = {
      type: req.query.type,
      category: req.query.category,
      start_date: req.query.start_date,
      end_date: req.query.end_date
    };

    const transactions = await TransactionService.getAll(filters);
    return ApiResponse.success(res, { transactions }, 'Transactions retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const transaction = await TransactionService.getById(req.params.id);
    
    if (!transaction) {
      return ApiResponse.notFound(res, 'Transaction');
    }

    return ApiResponse.success(res, { transaction }, 'Transaction retrieved successfully');
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

    const transaction = await TransactionService.create(req.body, req.user.id);
    
    // Log activity (non-blocking)
    ActivityLogService.logActivity(
      req.user.id,
      'create',
      'transactions',
      `Created ${transaction.type}: RS ${transaction.amount}`
    );

    return ApiResponse.success(res, { transaction }, 'Transaction created successfully', 201);
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

    const transaction = await TransactionService.update(req.params.id, req.body);
    
    if (!transaction) {
      return ApiResponse.notFound(res, 'Transaction');
    }

    // Log activity (non-blocking)
    ActivityLogService.logActivity(
      req.user.id,
      'update',
      'transactions',
      `Updated transaction: RS ${transaction.amount}`
    );

    return ApiResponse.success(res, { transaction }, 'Transaction updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await TransactionService.getById(req.params.id);
    
    if (!transaction) {
      return ApiResponse.notFound(res, 'Transaction');
    }

    const amount = transaction.amount;
    const deleted = await TransactionService.delete(req.params.id);

    if (!deleted) {
      return ApiResponse.error(res, 'Failed to delete transaction', 500);
    }

    // Log activity (non-blocking)
    ActivityLogService.logActivity(
      req.user.id,
      'delete',
      'transactions',
      `Deleted transaction: RS ${amount}`
    );

    return ApiResponse.success(res, null, 'Transaction deleted successfully');
  } catch (error) {
    next(error);
  }
};

const getSummary = async (req, res, next) => {
  try {
    const filters = {
      start_date: req.query.start_date,
      end_date: req.query.end_date
    };

    const summary = await TransactionService.getSummary(filters);
    return ApiResponse.success(res, { summary }, 'Summary retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getByCategory = async (req, res, next) => {
  try {
    const filters = {
      start_date: req.query.start_date,
      end_date: req.query.end_date
    };

    const byCategory = await TransactionService.getByCategory(filters);
    return ApiResponse.success(res, { byCategory }, 'Category breakdown retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  delete: deleteTransaction,
  getSummary,
  getByCategory,
  validateTransaction
};
