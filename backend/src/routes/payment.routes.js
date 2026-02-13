const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const requestTimeout = require('../middleware/requestTimeout.middleware');
const paymentController = require('../controllers/paymentController');

// Apply longer timeout for payment operations (60 seconds)
router.use(requestTimeout(60000));

router.post(
  '/',
  authenticate,
  upload.single('receiptImage'),
  paymentController.createPayment
);

router.put(
  '/:id',
  authenticate,
  upload.single('receiptImage'),         
  paymentController.updatePayment
);

router.get('/', authenticate, paymentController.getAllPayments);
router.get('/customer/:customerId', authenticate, paymentController.getPaymentsByCustomer);
router.delete('/:id', authenticate, paymentController.deletePayment);

module.exports = router;