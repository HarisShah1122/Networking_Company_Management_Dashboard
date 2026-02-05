const { validationResult } = require('express-validator');
const UserService = require('../services/user.service');
const activityLogService = require('../services/activityLog.service');
const ApiResponse = require('../helpers/responses');
const { validateUser } = require('../helpers/validators');

const getAll = async (req, res, next) => {
  try {
    const users = await UserService.getAll(req.companyId);
    return ApiResponse.success(res, { users }, 'Users retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const user = await UserService.getById(req.params.id, req.companyId);
    
    if (!user) {
      return ApiResponse.notFound(res, 'User');
    }

    return ApiResponse.success(res, { user }, 'User retrieved successfully');
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

    const { email, username } = req.body;

    const existingEmail = await UserService.getByEmail(email, req.companyId);
    if (existingEmail) {
      return ApiResponse.conflict(res, 'Email already exists');
    }

    const existingUsername = await UserService.getByUsername(username, req.companyId);
    if (existingUsername) {
      return ApiResponse.conflict(res, 'Username already exists');
    }

    const user = await UserService.create(req.body, req.companyId);
    
    activityLogService.logActivity(
      req.user.id,
      'create',
      'users',
      `Created user: ${user.username}`
    );

    const userResponse = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      status: user.status,
      created_at: user.created_at
    };

    return ApiResponse.success(res, { user: userResponse }, 'User created successfully', 201);
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

    const user = await UserService.update(req.params.id, req.body);
    
    if (!user) {
      return ApiResponse.notFound(res, 'User');
    }

    activityLogService.logActivity(
      req.user.id,
      'update',
      'users',
      `Updated user: ${user.username}`
    );

    return ApiResponse.success(res, { user }, 'User updated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  validateUser
};