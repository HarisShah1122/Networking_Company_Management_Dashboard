const { Complaint } = require('../models');
const assignmentService = require('../services/assignmentService');
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
      console.error('Error in assignComplaint:', error);
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
      console.error('Error in autoAssignMultipleComplaints:', error);
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
      console.error('Error in getAssignmentStats:', error);
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
      console.error('Error in getAvailableStaff:', error);
      return ApiResponse.error(res, 'Failed to get available staff', 500);
    }
  }

  async getStaffWorkload(req, res) {
    try {
      const { staffId } = req.params;
      
      const workload = await assignmentService.getStaffWorkload(parseInt(staffId));
      
      return ApiResponse.success(res, workload, 'Staff workload retrieved successfully');
    } catch (error) {
      console.error('Error in getStaffWorkload:', error);
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
      console.error('Error in getMardanOffices:', error);
      return ApiResponse.error(res, 'Failed to get Mardan offices', 500);
    }
  }

  async manualAssignment(req, res) {
    try {
      const { complaintId } = req.params;
      const { staffId, officeId, reason } = req.body;
      
      console.log('Manual assignment request:', { complaintId, staffId, officeId, reason });
      
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

      console.log('Updating complaint with staffId:', staffId);
      
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

      console.log('Assignment successful for complaint:', complaintId);

      return ApiResponse.success(res, {
        complaintId,
        staffId,
        assignmentMethod: 'manual'
      }, 'Complaint assigned manually successfully');
    } catch (error) {
      console.error('Error in manualAssignment:', error);
      console.error('Error details:', error.stack);
      return ApiResponse.error(res, 'Failed to assign complaint manually', 500);
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
      console.error('Error in reassignComplaint:', error);
      return ApiResponse.error(res, 'Failed to reassign complaint', 500);
    }
  }
}

module.exports = new AssignmentController();
