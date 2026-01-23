const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const paymentController = require('../controllers/paymentController'); 

router.post('/', authenticate, paymentController.createPayment);
router.get('/', authenticate, paymentController.getAllPayments);
router.get('/customer/:customerId', authenticate, paymentController.getPaymentsByCustomer);
router.put('/:id', authenticate, paymentController.updatePayment);
router.delete('/:id', authenticate, paymentController.deletePayment);

module.exports = router;