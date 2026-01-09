const { validationResult } = require('express-validator');
const StockService = require('../services/stock.service');
const ActivityLogService = require('../services/activityLog.service');
const ApiResponse = require('../helpers/responses');
const { validateStock } = require('../helpers/validators');

const getAll = async (req, res, next) => {
  try {
    const filters = {
      category: req.query.category,
      search: req.query.search
    };

    const stock = await StockService.getAll(filters);
    return ApiResponse.success(res, { stock }, 'Stock items retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const item = await StockService.getById(req.params.id);
    
    if (!item) {
      return ApiResponse.notFound(res, 'Stock item');
    }

    return ApiResponse.success(res, { item }, 'Stock item retrieved successfully');
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

    const item = await StockService.create(req.body);
    
    // Log activity (non-blocking)
    ActivityLogService.logActivity(
      req.user.id,
      'create',
      'stock',
      `Created stock item: ${item.name}`
    );

    return ApiResponse.success(res, { item }, 'Stock item created successfully', 201);
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

    const item = await StockService.update(req.params.id, req.body);
    
    if (!item) {
      return ApiResponse.notFound(res, 'Stock item');
    }

    // Log activity (non-blocking)
    ActivityLogService.logActivity(
      req.user.id,
      'update',
      'stock',
      `Updated stock item: ${item.name}`
    );

    return ApiResponse.success(res, { item }, 'Stock item updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteStock = async (req, res, next) => {
  try {
    const item = await StockService.getById(req.params.id);
    
    if (!item) {
      return ApiResponse.notFound(res, 'Stock item');
    }

    const itemName = item.name;
    const deleted = await StockService.delete(req.params.id);

    if (!deleted) {
      return ApiResponse.error(res, 'Failed to delete stock item', 500);
    }

    // Log activity (non-blocking)
    ActivityLogService.logActivity(
      req.user.id,
      'delete',
      'stock',
      `Deleted stock item: ${itemName}`
    );

    return ApiResponse.success(res, null, 'Stock item deleted successfully');
  } catch (error) {
    next(error);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const categories = await StockService.getCategories();
    return ApiResponse.success(res, { categories }, 'Categories retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getStats = async (req, res, next) => {
  try {
    const stats = await StockService.getStats();
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
  delete: deleteStock,
  getCategories,
  getStats,
  validateStock
};
