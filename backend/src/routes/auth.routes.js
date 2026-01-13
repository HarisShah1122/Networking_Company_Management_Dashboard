const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { handleValidationErrors } = require('../middleware/validation.middleware');
const { loginLimiter } = require('../middleware/rateLimit.middleware');

// Public login
router.post(
  '/login',
  loginLimiter,
  authController.validateLogin,
  handleValidationErrors,
  authController.login
);

// Public register
router.post(
  '/register',
  authController.validateRegister,
  handleValidationErrors,
  authController.register
);

// CEO-only admin creation
router.post(
  '/register-admin',
  authenticate,
  requireRole('CEO'),
  authController.validateRegister,
  handleValidationErrors,
  authController.register
);

// Get logged-in user
router.get('/me', authenticate, authController.getMe);

module.exports = router;
