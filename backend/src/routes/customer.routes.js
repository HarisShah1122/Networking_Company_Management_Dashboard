const express = require('express');
const router = express.Router();

const customerController = require('../controllers/customerController');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { handleValidationErrors } = require('../middleware/validation.middleware');
const { validateCustomer } = require('../helpers/validators/customer.validator'); 

// Require authentication for all routes
router.use(authenticate);

// Publicly accessible (but authenticated)
router.get('/', customerController.getAll);
router.get('/:id', customerController.getById);

// router.get('/stats', customerController.getStats);


router.post(
  '/',
  requireRole('CEO', 'Manager'),
  validateCustomer,
  handleValidationErrors,
  customerController.create
);

router.put(
  '/:id',
  requireRole('CEO', 'Manager'),
  validateCustomer,
  handleValidationErrors,
  customerController.update
);



module.exports = router;