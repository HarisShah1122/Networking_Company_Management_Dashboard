const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { handleValidationErrors } = require('../middleware/validation.middleware');
const { loginLimiter } = require('../middleware/rateLimit.middleware');


// LOGIN
router.post(
  '/login',
  loginLimiter,
  authController.validateLogin,
  handleValidationErrors,
  authController.login
);

// REGISTER
router.post(
  '/register',
  authController.validateRegister,
  handleValidationErrors,
  authController.register
);

// REGISTER ADMIN (CEO ONLY)
router.post(
  '/register-admin',
  authenticate,
  requireRole('CEO'),
  authController.validateRegister,
  handleValidationErrors,
  authController.register
);

// GET CURRENT USER
router.get('/me', authenticate, authController.getMe);

// LOGOUT
router.post('/logout', authController.logout);

module.exports = router;
