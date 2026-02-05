const { validationResult } = require('express-validator');
const AreaService = require('../services/area.service');
const ApiResponse = require('../helpers/responses');

const getAll = async (req, res, next) => {
  try {
    const areas = await AreaService.getAll(req.companyId);
    return ApiResponse.success(res, { areas }, 'Areas retrieved');
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const area = await AreaService.getById(req.params.id, req.companyId);
    if (!area) return ApiResponse.notFound(res, 'Area');
    return ApiResponse.success(res, { area }, 'Area retrieved');
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

    console.log('AreaController.create - req.companyId:', req.companyId);
    
    if (!req.companyId) {
      return ApiResponse.error(res, 'Company ID is required', 400);
    }

    const area = await AreaService.create(req.body, req.companyId);
    return ApiResponse.success(res, { area }, 'Area created', 201);
  } catch (error) {
    console.error('Area creation error:', error);
    
    // Handle specific validation errors
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(e => e.message);
      return ApiResponse.error(res, messages.join(', '), 422);
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
      return ApiResponse.error(res, 'Area name already exists', 409);
    }
    
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ApiResponse.validationError(res, errors.array());
    }

    const area = await AreaService.update(req.params.id, req.body, req.companyId);
    if (!area) return ApiResponse.notFound(res, 'Area');
    return ApiResponse.success(res, { area }, 'Area updated');
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getById, create, update };
