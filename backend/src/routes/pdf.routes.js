const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { generatePaymentReceipt, viewPaymentReceipt } = require('../controllers/pdfController');

/**
 * PDF Routes
 */

// Generate and download payment receipt PDF
router.get('/payment/:paymentId/download', authenticate, generatePaymentReceipt);

// View payment receipt PDF inline
router.get('/payment/:paymentId/view', authenticate, viewPaymentReceipt);

module.exports = router;
