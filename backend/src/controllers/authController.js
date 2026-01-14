const { validationResult } = require('express-validator');
const AuthService = require('../services/auth.service');
const UserService = require('../services/user.service');
const ApiResponse = require('../helpers/responses');
const { validateLogin, validateRegister } = require('../helpers/validators');

const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ApiResponse.validationError(res, errors.array());
    }

    const { username, password } = req.body;

    const result = await AuthService.login(username, password);

    return ApiResponse.success(res, result, 'Login successful');
  } catch (error) {
    if (
      error.message === 'Invalid credentials' ||
      error.message === 'Account is inactive'
    ) {
      return ApiResponse.unauthorized(res, error.message);
    }
    next(error);
  }
};

const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ApiResponse.validationError(res, errors.array());
    }

    const result = await AuthService.register(req.body);

    return ApiResponse.success(res, result, 'User registered successfully', 201);
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await UserService.getById(req.user.userId);

    if (!user) {
      return ApiResponse.notFound(res, 'User');
    }

    return ApiResponse.success(res, { user });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  register,
  getMe,
  validateLogin,
  validateRegister
};
