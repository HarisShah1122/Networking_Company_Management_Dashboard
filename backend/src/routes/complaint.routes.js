const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaintController');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { handleValidationErrors } = require('../middleware/validation.middleware');
const { validateComplaint } = require('../helpers/validators/complaint.validator');

router.post('/', authenticate, validateComplaint, handleValidationErrors, complaintController.createComplaint);
router.get('/', authenticate, complaintController.getAllComplaints);
router.get('/stats', authenticate, complaintController.getStats);
router.put('/:id', authenticate, requireRole('CEO', 'Manager'), validateComplaint, handleValidationErrors, complaintController.updateComplaint);
// router.delete('/:id', authenticate, requireRole('CEO', 'Manager'), complaintController.deleteComplaint);

module.exports = router;