const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { handleValidationErrors } = require('../middleware/validation.middleware');

// All routes require authentication
router.use(authenticate);

// All routes accessible to Manager and CEO
router.get('/', customerController.getAll);
router.get('/stats', customerController.getStats);
router.get('/:id', customerController.getById);
router.post(
  '/',
  requireRole('CEO', 'Manager'),
  customerController.validateCustomer,
  handleValidationErrors,
  customerController.create
);
router.put(
  '/:id',
  requireRole('CEO', 'Manager'),
  customerController.validateCustomer,
  handleValidationErrors,
  customerController.update
);
router.delete(
  '/:id',
  requireRole('CEO', 'Manager'),
  customerController.delete
);

module.exports = router;

