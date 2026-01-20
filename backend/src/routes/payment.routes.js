const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const paymentController = require('../controllers/paymentController');

router.post(
  '/',
  authenticate,
  upload.single('receiptImage'),
  paymentController.createPayment
);

router.get('/', authenticate, paymentController.getAllPayments);
router.get('/customer/:customerId', authenticate, paymentController.getPaymentsByCustomer);

module.exports = router;
