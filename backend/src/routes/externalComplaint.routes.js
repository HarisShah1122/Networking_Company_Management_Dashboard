const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const {
  getAllComplaints,
  syncExternalComplaints,
  createExternalComplaint,
  getComplaintStats,
  getBranchConfig
} = require('../controllers/externalComplaintController');

// Get all complaints with filtering
router.get('/', authenticate, getAllComplaints);

// Get complaint statistics
router.get('/stats', authenticate, getComplaintStats);

// Get branch configuration
router.get('/branches', authenticate, getBranchConfig);

// Sync external complaints
router.post('/sync', authenticate, syncExternalComplaints);

// Create external complaint
router.post('/', authenticate, createExternalComplaint);

module.exports = router;
