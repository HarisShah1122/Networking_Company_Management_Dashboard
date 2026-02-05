const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const { authenticate } = require('../middleware/auth.middleware');
const { validateAssignment } = require('../validators/assignmentValidator');

router.post('/complaints/:complaintId/assign', 
  authenticate, 
  assignmentController.assignComplaint
);

router.post('/complaints/auto-assign', 
  authenticate, 
  assignmentController.autoAssignMultipleComplaints
);

router.post('/complaints/:complaintId/manual-assign', 
  authenticate, 
  validateAssignment,
  assignmentController.manualAssignment
);

router.put('/complaints/:complaintId/reassign', 
  authenticate, 
  validateAssignment,
  assignmentController.reassignComplaint
);

router.get('/stats', 
  authenticate, 
  assignmentController.getAssignmentStats
);

router.get('/staff/available', 
  authenticate, 
  assignmentController.getAvailableStaff
);

router.get('/staff/:staffId/workload', 
  authenticate, 
  assignmentController.getStaffWorkload
);

router.get('/mardan/offices', 
  authenticate, 
  assignmentController.getMardanOffices
);

// Area-based assignment routes
router.post('/complaints/:complaintId/assign-by-area', 
  authenticate, 
  assignmentController.assignComplaintByArea
);

router.get('/area/stats', 
  authenticate, 
  assignmentController.getAreaAssignmentStats
);

router.get('/area/technicians/available', 
  authenticate, 
  assignmentController.getAvailableTechniciansByArea
);

router.get('/complaints/:complaintId/nearest-area', 
  authenticate, 
  assignmentController.findNearestAreaWithTechnicians
);

module.exports = router;
