const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { handleValidationErrors } = require('../middleware/validation.middleware');

// Public routes
router.post(
  '/login',
  authController.validateLogin,
  handleValidationErrors,
  authController.login
);

// CEO only route
router.post(
  '/register',
  authenticate,
  requireRole('CEO'),
  authController.validateRegister,
  handleValidationErrors,
  authController.register
);

// Protected route
router.get('/me', authenticate, authController.getMe);

module.exports = router;

