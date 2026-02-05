const { Complaint } = require('../models');
const assignmentService = require('../services/assignmentService');
const areaAssignmentService = require('../services/areaAssignmentService');
const ApiResponse = require('../helpers/responses');

class AssignmentController {
  async assignComplaint(req, res) {
    try {
      const { complaintId } = req.params;
      
      const complaint = await Complaint.findOne({ 
        where: { 
          id: complaintId,
          company_id: req.companyId 
        } 
      });
      if (!complaint) {
        return ApiResponse.notFound(res, 'Complaint');
      }

      if (complaint.assignedTo) {
        return ApiResponse.error(res, 'Complaint is already assigned', 400);
      }

      const assignmentResult = await assignmentService.assignComplaint(complaint);
      
      if (assignmentResult.success) {
        return ApiResponse.success(res, assignmentResult, 'Complaint assigned successfully');
      } else {
        return ApiResponse.error(res, assignmentResult.message, 400, {
          requiresManualAssignment: assignmentResult.requiresManualAssignment,
          officeId: assignmentResult.officeId
        });
      }
    } catch (error) {
      return ApiResponse.error(res, 'Failed to assign complaint', 500);
    }
  }

  async autoAssignMultipleComplaints(req, res) {
    try {
      const { complaintIds } = req.body;
      
      if (!Array.isArray(complaintIds) || complaintIds.length === 0) {
        return ApiResponse.error(res, 'Invalid complaint IDs provided', 400);
      }

      const results = [];
      
      for (const complaintId of complaintIds) {
        const complaint = await Complaint.findOne({ 
          where: { 
            id: complaintId,
            company_id: req.companyId 
          } 
        });
        if (!complaint) {
          results.push({
            complaintId,
            success: false,
            message: 'Complaint not found'
          });
          continue;
        }

        if (complaint.assignedTo) {
          results.push({
            complaintId,
            success: false,
            message: 'Already assigned'
          });
          continue;
        }

        const assignmentResult = await assignmentService.assignComplaint(complaint);
        results.push({
          complaintId,
          ...assignmentResult
        });
      }

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      return ApiResponse.success(res, {
        total: complaintIds.length,
        successful,
        failed,
        results
      }, `Processed ${complaintIds.length} complaints`);
    } catch (error) {
      return ApiResponse.error(res, 'Failed to process assignments', 500);
    }
  }

  async getAssignmentStats(req, res) {
    try {
      const stats = await assignmentService.getAssignmentStats();
      const mardanStats = await assignmentService.getMardanDistrictStats();
      
      return ApiResponse.success(res, {
        overall: stats,
        mardanDistrict: mardanStats
      }, 'Assignment statistics retrieved successfully');
    } catch (error) {
      return ApiResponse.error(res, 'Failed to get assignment statistics', 500);
    }
  }

  async getAvailableStaff(req, res) {
    try {
      const { officeId } = req.query;
      
      if (!officeId) {
        return ApiResponse.error(res, 'Office ID is required', 400);
      }

      const availableStaff = await assignmentService.getAvailableStaff(officeId);
      
      return ApiResponse.success(res, availableStaff, 'Available staff retrieved successfully');
    } catch (error) {
      return ApiResponse.error(res, 'Failed to get available staff', 500);
    }
  }

  async getStaffWorkload(req, res) {
    try {
      const { staffId } = req.params;
      
      const workload = await assignmentService.getStaffWorkload(parseInt(staffId));
      
      return ApiResponse.success(res, workload, 'Staff workload retrieved successfully');
    } catch (error) {
      return ApiResponse.error(res, 'Failed to get staff workload', 500);
    }
  }

  async getMardanOffices(req, res) {
    try {
      const { MARDAN_OFFICE_LOCATIONS } = require('../config/geographicConfig');
      
      const officesWithStats = await Promise.all(
        MARDAN_OFFICE_LOCATIONS.map(async (office) => {
          const availableStaff = await assignmentService.getAvailableStaff(office.id);
          return {
            ...office,
            availableStaffCount: availableStaff.length,
            availableStaff: availableStaff.map(staff => ({
              id: staff.id,
              name: staff.name,
              workload: staff.workload,
              availabilityScore: staff.availabilityScore
            }))
          };
        })
      );
      
      return ApiResponse.success(res, officesWithStats, 'Mardan offices retrieved successfully');
    } catch (error) {
      return ApiResponse.error(res, 'Failed to get Mardan offices', 500);
    }
  }

  async manualAssignment(req, res) {
    try {
      const { complaintId } = req.params;
      const { staffId, officeId, reason } = req.body;
      
      if (!staffId) {
        return ApiResponse.error(res, 'Staff ID is required', 400);
      }

      const complaint = await Complaint.findByPk(complaintId);
      if (!complaint) {
        return ApiResponse.notFound(res, 'Complaint');
      }

      if (complaint.assignedTo) {
        return ApiResponse.error(res, 'Complaint is already assigned', 400);
      }

      await Complaint.update(
        {
          assignedTo: staffId,
          status: 'in_progress'
        },
        {
          where: { id: complaintId }
        }
      );

      // assignmentService.updateWorkloadCache(staffId, 'increment');

      return ApiResponse.success(res, {
        complaintId,
        staffId,
        assignmentMethod: 'manual'
      }, 'Complaint assigned manually successfully');
    } catch (error) {
      return ApiResponse.error(res, 'Failed to assign complaint manually', 500);
    }
  }

  async assignComplaintByArea(req, res) {
    try {
      const { complaintId } = req.params;
      
      const complaint = await Complaint.findOne({ 
        where: { 
          id: complaintId,
          company_id: req.companyId 
        } 
      });
      if (!complaint) {
        return ApiResponse.notFound(res, 'Complaint');
      }

      if (complaint.assignedTo) {
        return ApiResponse.error(res, 'Complaint is already assigned', 400);
      }

      const assignmentResult = await areaAssignmentService.assignComplaintToNearestTechnician(complaintId);
      
      if (assignmentResult.success) {
        return ApiResponse.success(res, assignmentResult, 'Complaint assigned to nearest technician successfully');
      } else {
        return ApiResponse.error(res, assignmentResult.message, 400, {
          requiresManualAssignment: assignmentResult.requiresManualAssignment,
          suggestedArea: assignmentResult.suggestedArea
        });
      }
    } catch (error) {
      return ApiResponse.error(res, 'Failed to assign complaint by area', 500);
    }
  }

  async getAreaAssignmentStats(req, res) {
    try {
      const stats = await areaAssignmentService.getAreaAssignmentStats(req.companyId);
      
      return ApiResponse.success(res, stats, 'Area assignment statistics retrieved successfully');
    } catch (error) {
      return ApiResponse.error(res, 'Failed to get area assignment statistics', 500);
    }
  }

  async getAvailableTechniciansByArea(req, res) {
    try {
      const { areaId } = req.query;
      
      if (!areaId) {
        return ApiResponse.error(res, 'Area ID is required', 400);
      }

      const availableTechnicians = await areaAssignmentService.getAvailableTechnicians(areaId, req.companyId);
      
      return ApiResponse.success(res, availableTechnicians, 'Available technicians retrieved successfully');
    } catch (error) {
      return ApiResponse.error(res, 'Failed to get available technicians', 500);
    }
  }

  async findNearestAreaWithTechnicians(req, res) {
    try {
      const { complaintId } = req.params;
      
      const complaint = await Complaint.findOne({ 
        where: { 
          id: complaintId,
          company_id: req.companyId 
        } 
      });
      
      if (!complaint) {
        return ApiResponse.notFound(res, 'Complaint');
      }

      const complaintLocation = await areaAssignmentService.getComplaintLocation(complaint);
      const nearestArea = await areaAssignmentService.findNearestAreaWithTechnicians(complaintLocation);
      
      if (nearestArea) {
        return ApiResponse.success(res, {
          nearestArea: nearestArea,
          complaintLocation: complaintLocation
        }, 'Nearest area with technicians found');
      } else {
        return ApiResponse.error(res, 'No areas with available technicians found', 404);
      }
    } catch (error) {
      return ApiResponse.error(res, 'Failed to find nearest area', 500);
    }
  }

  async reassignComplaint(req, res) {
    try {
      const { complaintId } = req.params;
      const { newStaffId, reason } = req.body;
      
      if (!newStaffId) {
        return ApiResponse.error(res, 'New Staff ID is required', 400);
      }

      const complaint = await Complaint.findByPk(complaintId);
      if (!complaint) {
        return ApiResponse.notFound(res, 'Complaint');
      }

      const oldStaffId = complaint.assignedTo;

      await Complaint.update(
        {
          assignedTo: newStaffId,
          status: 'in_progress'
        },
        {
          where: { id: complaintId }
        }
      );

      return ApiResponse.success(res, {
        complaintId,
        oldStaffId,
        newStaffId,
        assignmentMethod: 'reassigned'
      }, 'Complaint reassigned successfully');
    } catch (error) {
      return ApiResponse.error(res, 'Failed to reassign complaint', 500);
    }
  }
}

module.exports = new AssignmentController();
