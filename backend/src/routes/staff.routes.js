const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const { authenticate } = require('../middleware/auth.middleware');

// Get all staff members
router.get('/staff-list', 
  authenticate, 
  staffController.getAllStaff
);

module.exports = router;
