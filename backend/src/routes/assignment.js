const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const auth = require('../middleware/auth');
const { validateAssignment } = require('../validators/assignmentValidator');

router.post('/complaints/:complaintId/assign', 
  auth.authenticate, 
  auth.authorize(['admin', 'manager']), 
  assignmentController.assignComplaint
);

router.post('/complaints/auto-assign', 
  auth.authenticate, 
  auth.authorize(['admin', 'manager']), 
  assignmentController.autoAssignMultipleComplaints
);

router.post('/complaints/:complaintId/manual-assign', 
  auth.authenticate, 
  auth.authorize(['admin', 'manager']), 
  validateAssignment,
  assignmentController.manualAssignment
);

router.put('/complaints/:complaintId/reassign', 
  auth.authenticate, 
  auth.authorize(['admin', 'manager']), 
  validateAssignment,
  assignmentController.reassignComplaint
);

router.get('/stats', 
  auth.authenticate, 
  auth.authorize(['admin', 'manager', 'staff']), 
  assignmentController.getAssignmentStats
);

router.get('/staff/available', 
  auth.authenticate, 
  auth.authorize(['admin', 'manager']), 
  assignmentController.getAvailableStaff
);

router.get('/staff/:staffId/workload', 
  auth.authenticate, 
  auth.authorize(['admin', 'manager', 'staff']), 
  assignmentController.getStaffWorkload
);

router.get('/mardan/offices', 
  auth.authenticate, 
  auth.authorize(['admin', 'manager', 'staff']), 
  assignmentController.getMardanOffices
);

module.exports = router;
