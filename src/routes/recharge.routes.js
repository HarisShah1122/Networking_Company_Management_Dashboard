const express = require('express');
const router = express.Router();

const rechargeController = require('../controllers/rechargeController');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { handleValidationErrors } = require('../middleware/validation.middleware');
const { validateRecharge } = require('../helpers/validators/recharge.validator');

router.use(authenticate);

router.get('/', rechargeController.getAll);
router.get('/:id', rechargeController.getById);
router.get('/due', rechargeController.getDuePayments);
router.get('/stats', rechargeController.getStats);

router.post(
  '/',
  requireRole('CEO', 'Manager'),
  validateRecharge,
  handleValidationErrors,
  rechargeController.create
);

router.put(
  '/:id',
  requireRole('CEO', 'Manager'),
  validateRecharge,
  handleValidationErrors,
  rechargeController.update
);

module.exports = router;