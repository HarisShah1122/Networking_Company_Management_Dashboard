const express = require('express');
const router = express.Router();

const upload = require('../middleware/upload.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { validateTransaction } = require('../helpers/validators/transaction.validator');
const { handleValidationErrors } = require('../middleware/validation.middleware');
const { validateFileUpload } = require('../middleware/fileValidation.middleware');

const transactionController = require('../controllers/transactionController');

router.use(authenticate);

router.get('/', transactionController.getAll);
router.get('/summary', transactionController.getSummary);
router.get('/revenue-growth', transactionController.getRevenueGrowth);

router.post(
  '/',
  requireRole('CEO', 'Manager'),
  upload.single('receiptImage'),
  validateTransaction,
  handleValidationErrors,
  validateFileUpload,
  transactionController.create
);

router.put(
  '/:id',
  requireRole('CEO', 'Manager'),
  upload.single('receiptImage'),
  validateTransaction,
  handleValidationErrors,
  validateFileUpload,
  transactionController.update
);

module.exports = router;
