const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/auth.middleware');

// Send assignment notification
router.post('/assignment', notificationController.sendAssignmentNotification);

module.exports = router;
