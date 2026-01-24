const express = require('express');
const router = express.Router();

const upload = require('../middleware/upload.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

const transactionController = require('../controllers/transactionController');

router.use(authenticate);

router.get('/', transactionController.getAll);
router.get('/summary', transactionController.getSummary);

router.post(
  '/',
  requireRole('CEO', 'Manager'),
  upload.single('receiptImage'), 
  transactionController.create
);

router.put(
  '/:id',
  requireRole('CEO', 'Manager'),
  upload.single('receiptImage'),
  transactionController.update
);

module.exports = router;
