const express = require('express');
const router = express.Router();
const areaManagementService = require('../services/areaManagement.service');
const { authenticate } = require('../middleware/auth.middleware');

// Get all areas with their assigned managers
router.get('/areas-with-managers', authenticate, async (req, res) => {
  try {
    const { company_id } = req.user;
    const areas = await areaManagementService.getAllAreasWithManagers(company_id);
    res.json({
      success: true,
      data: areas
    });
  } catch (error) {
    console.error('Error getting areas with managers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get areas with managers',
      error: error.message
    });
  }
});

// Get area manager
router.get('/area-manager/:areaId', authenticate, async (req, res) => {
  try {
    const { areaId } = req.params;
    const manager = await areaManagementService.getAreaManager(areaId);
    
    if (!manager) {
      return res.status(404).json({
        success: false,
        message: 'No manager assigned to this area'
      });
    }
    
    res.json({
      success: true,
      data: manager
    });
  } catch (error) {
    console.error('Error getting area manager:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get area manager',
      error: error.message
    });
  }
});

// Get technicians in an area with workload
router.get('/area-technicians/:areaId', authenticate, async (req, res) => {
  try {
    const { areaId } = req.params;
    const technicians = await areaManagementService.getAreaTechniciansWithWorkload(areaId);
    res.json({
      success: true,
      data: technicians
    });
  } catch (error) {
    console.error('Error getting area technicians:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get area technicians',
      error: error.message
    });
  }
});

// Assign manager to area (Manager or CEO only)
router.post('/assign-manager', authenticate, async (req, res) => {
  try {
    const { areaId, managerId } = req.body;
    const { role } = req.user;
    
    // Check if user is Manager or CEO
    if (!['Manager', 'CEO'].includes(role)) {
      return res.status(403).json({
        success: false,
        message: 'Only Managers and CEOs can assign managers to areas'
      });
    }
    
    if (!areaId || !managerId) {
      return res.status(400).json({
        success: false,
        message: 'Area ID and Manager ID are required'
      });
    }
    
    const result = await areaManagementService.assignManagerToArea(areaId, managerId);
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Error assigning manager to area:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign manager to area',
      error: error.message
    });
  }
});

// Auto-assign technician to complaint
router.post('/auto-assign-technician/:areaId', authenticate, async (req, res) => {
  try {
    const { areaId } = req.params;
    const technician = await areaManagementService.autoAssignTechnician(areaId);
    
    if (!technician) {
      return res.status(404).json({
        success: false,
        message: 'No technicians available in this area'
      });
    }
    
    res.json({
      success: true,
      data: technician
    });
  } catch (error) {
    console.error('Error auto-assigning technician:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to auto-assign technician',
      error: error.message
    });
  }
});

// Reassign complaint (Manager override)
router.post('/reassign-complaint', authenticate, async (req, res) => {
  try {
    const { complaintId, newTechnicianId } = req.body;
    const { id: managerId, role } = req.user;
    
    // Check if user is Manager or CEO
    if (!['Manager', 'CEO'].includes(role)) {
      return res.status(403).json({
        success: false,
        message: 'Only Managers and CEOs can reassign complaints'
      });
    }
    
    if (!complaintId || !newTechnicianId) {
      return res.status(400).json({
        success: false,
        message: 'Complaint ID and New Technician ID are required'
      });
    }
    
    const result = await areaManagementService.reassignComplaint(
      complaintId, 
      newTechnicianId, 
      managerId
    );
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Error reassigning complaint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reassign complaint',
      error: error.message
    });
  }
});

// Get technician workload
router.get('/technician-workload/:technicianId', authenticate, async (req, res) => {
  try {
    const { technicianId } = req.params;
    const workload = await areaManagementService.getTechnicianWorkload(technicianId);
    res.json({
      success: true,
      data: { activeComplaints: workload }
    });
  } catch (error) {
    console.error('Error getting technician workload:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get technician workload',
      error: error.message
    });
  }
});

module.exports = router;
