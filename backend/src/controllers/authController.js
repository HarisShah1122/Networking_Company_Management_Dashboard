const { validationResult } = require('express-validator');
const AuthService = require('../services/auth.service');
const UserService = require('../services/user.service');
const ApiResponse = require('../helpers/responses');
const { validateLogin, validateRegister } = require('../helpers/validators');

/* LOGIN */
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return ApiResponse.validationError(res, errors.array());

    const { username, password } = req.body;
    const result = await AuthService.login(username, password);

    // Create session for session-based auth
    req.session.user = {
      userId: result.user.id,
      role: result.user.role,
      companyId: result.user.companyId,
    };

    console.log('🔐 Login successful - sending JWT token and creating session');

    return ApiResponse.success(
      res,
      {
        token: result.token,
        user: result.user,
        company: result.company,
        authMethod: 'hybrid', // Both JWT and session available
      },
      'Login successful'
    );
  } catch (error) {
    if (['Invalid credentials', 'Account is inactive'].includes(error.message)) {
      return ApiResponse.unauthorized(res, error.message);
    }
    next(error);
  }
};

/* REGISTER */
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return ApiResponse.validationError(res, errors.array());

    const result = await AuthService.register(req.body);

    // Create session for session-based auth
    req.session.user = {
      userId: result.user.id,
      role: result.user.role,
      companyId: result.user.companyId,
    };

    console.log('🔐 Registration successful - sending JWT token and creating session');

    return ApiResponse.success(
      res,
      {
        token: result.token,
        user: result.user,
        company: result.company,
        authMethod: 'hybrid', // Both JWT and session available
      },
      'User registered successfully',
      201
    );
  } catch (error) {
    next(error);
  }
};

/* GET CURRENT USER */
const getMe = async (req, res, next) => {
  try {
    if (!req.user) {
      return ApiResponse.unauthorized(res, 'Not authenticated');
    }

    return ApiResponse.success(res, {
      user: {
        id: req.user.id,
        username: req.user.username,
        role: req.user.role,
        companyId: req.user.companyId,
      },
    });
  } catch (error) {
    next(error);
  }
};

/* LOGOUT */
const logout = async (req, res) => {
  try {
    // Clear session for session-based auth
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
      }
    });
    
    // JWT tokens are stateless - client will handle token removal
    console.log('🔐 Logout successful - session cleared, JWT tokens to be cleared by client');
    return ApiResponse.success(res, null, 'Logged out successfully');
  } catch (error) {
    return ApiResponse.error(res, 'Failed to logout');
  }
};

module.exports = {
  login,
  register,
  getMe,
  logout,
  validateLogin,
  validateRegister,
};
