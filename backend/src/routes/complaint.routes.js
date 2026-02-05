const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaintController');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { handleValidationErrors } = require('../middleware/validation.middleware');
const { validateComplaint } = require('../helpers/validators/complaint.validator');
const { enforceCompanyFiltering } = require('../middleware/companyIsolation.middleware');

router.post('/', authenticate, enforceCompanyFiltering, validateComplaint, handleValidationErrors, complaintController.createComplaint);
router.get('/', authenticate, enforceCompanyFiltering, complaintController.getAllComplaints);
router.get('/stats', authenticate, enforceCompanyFiltering, complaintController.getStats);
router.get('/sla-stats', authenticate, enforceCompanyFiltering, complaintController.getSLAStats);
router.put('/:id', authenticate, enforceCompanyFiltering, requireRole('CEO', 'Manager'), validateComplaint, handleValidationErrors, complaintController.updateComplaint);
router.post('/:id/assign', authenticate, enforceCompanyFiltering, requireRole('CEO', 'Manager'), complaintController.assignToTechnician);
// router.delete('/:id', authenticate, requireRole('CEO', 'Manager'), complaintController.deleteComplaint);

module.exports = router;