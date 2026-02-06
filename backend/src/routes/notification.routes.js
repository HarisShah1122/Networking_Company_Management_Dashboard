const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth.middleware');

// Send assignment notification
router.post('/assignment', authenticate, notificationController.sendAssignmentNotification);

// Send complaint status update notification
router.post('/complaint-status', authenticate, notificationController.sendComplaintStatusUpdateNotification);

// Send payment confirmation notification
router.post('/payment-confirmation', authenticate, notificationController.sendPaymentConfirmationNotification);

// Send customer welcome notification
router.post('/customer-welcome', authenticate, notificationController.sendCustomerWelcomeNotification);

// Send SLA breach warning notification
router.post('/sla-breach', authenticate, notificationController.sendSLABreachWarningNotification);

// Send generic notification
router.post('/generic', authenticate, notificationController.sendGenericNotification);

// Test email configuration
router.post('/test', authenticate, notificationController.testEmailConfiguration);

module.exports = router;
