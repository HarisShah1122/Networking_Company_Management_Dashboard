const { validationResult } = require('express-validator');
const AuthService = require('../services/auth.service');
const UserService = require('../services/user.service');
const ApiResponse = require('../helpers/responses');
const { validateLogin, validateRegister } = require('../helpers/validators');

class AuthController {
  static async login(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ApiResponse.validationError(res, errors.array());
      }

      const { email, password } = req.body;
      const result = await AuthService.login(email, password);

      return ApiResponse.success(res, result, 'Login successful');
    } catch (error) {
      if (error.message === 'Invalid credentials' || error.message === 'Account is inactive') {
        return ApiResponse.unauthorized(res, error.message);
      }
      next(error);
    }
  }

  static async register(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ApiResponse.validationError(res, errors.array());
      }

      const result = await AuthService.register(req.body);

      return ApiResponse.success(res, result, 'User registered successfully', 201);
    } catch (error) {
      if (error.message.includes('already exists')) {
        return ApiResponse.conflict(res, error.message);
      }
      next(error);
    }
  }

  static async getMe(req, res, next) {
    try {
      const user = await UserService.getById(req.user.id);
      
      if (!user) {
        return ApiResponse.notFound(res, 'User');
      }

      return ApiResponse.success(res, { user }, 'User retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = {
  login: AuthController.login,
  register: AuthController.register,
  getMe: AuthController.getMe,
  validateLogin,
  validateRegister
};
