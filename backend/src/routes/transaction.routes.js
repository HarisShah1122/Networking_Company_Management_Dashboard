const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { handleValidationErrors } = require('../middleware/validation.middleware');
const { validateTransaction } = require('../helpers/validators/transaction.validator');

router.use(authenticate);

router.get('/', transactionController.getAll);
router.get('/summary', transactionController.getSummary);
router.get('/revenue-growth', transactionController.getRevenueGrowth);
router.get('/search-trx', transactionController.searchTrx);
router.get('/:id', transactionController.getById);
router.post(
  '/',
  requireRole('CEO', 'Manager'),
  validateTransaction,
  handleValidationErrors,
  transactionController.create
);
router.put(
  '/:id',
  requireRole('CEO', 'Manager'),
  validateTransaction,
  handleValidationErrors,
  transactionController.update
);
// router.delete(
//   '/:id',
//   requireRole('CEO', 'Manager'),
//   transactionController.delete
// );

module.exports = router;