const { validationResult } = require('express-validator');
const AreaService = require('../services/area.service');
const ApiResponse = require('../helpers/responses');

const getAll = async (req, res, next) => {
  try {
    const areas = await AreaService.getAll();
    return ApiResponse.success(res, { areas }, 'Areas retrieved');
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const area = await AreaService.getById(req.params.id);
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

    const area = await AreaService.create(req.body);
    return ApiResponse.success(res, { area }, 'Area created', 201);
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

    const area = await AreaService.update(req.params.id, req.body);
    if (!area) return ApiResponse.notFound(res, 'Area');
    return ApiResponse.success(res, { area }, 'Area updated');
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getById, create, update };
