const express = require('express');
const router = express.Router();
const rechargeController = require('../controllers/rechargeController');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { handleValidationErrors } = require('../middleware/validation.middleware');

router.use(authenticate);

router.get('/', rechargeController.getAll);
router.get('/due', rechargeController.getDuePayments);
router.get('/stats', rechargeController.getStats);
router.get('/:id', rechargeController.getById);
router.post(
  '/',
  requireRole('CEO', 'Manager'),
  rechargeController.validateRecharge,
  handleValidationErrors,
  rechargeController.create
);
router.put(
  '/:id',
  requireRole('CEO', 'Manager'),
  rechargeController.validateRecharge,
  handleValidationErrors,
  rechargeController.update
);

module.exports = router;

