const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaintController');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.post('/', authenticate, complaintController.createComplaint);
router.get('/', authenticate, complaintController.getAllComplaints);
router.put('/:id', authenticate, requireRole(['CEO', 'Manager']), complaintController.updateComplaint);

module.exports = router;