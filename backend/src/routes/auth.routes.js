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

// ✅ LOGOUT (FIXED)
router.post('/logout', authenticate, (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

module.exports = router;
