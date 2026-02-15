const models = require('../models');
const { Area, User, Complaint, sequelize } = models;

/**
 * Get the manager assigned to a specific area
 */
const getAreaManager = async (areaId) => {
  try {
    const area = await Area.findOne({
      where: { id: areaId },
      include: [{
        model: User,
        as: 'manager',
        attributes: ['id', 'username', 'email', 'phone', 'name']
      }]
    });
    
    return area?.manager || null;
  } catch (error) {
    console.error('Error getting area manager:', error);
    throw error;
  }
};

/**
 * Get all technicians assigned to a specific area
 */
const getAreaTechnicians = async (areaId) => {
  try {
    const technicians = await User.findAll({
      where: {
        role: 'Technician',
        status: 'active',
        companyId: areaId
      },
      attributes: ['id', 'username', 'email', 'phone', 'name']
    });
    
    return technicians;
  } catch (error) {
    console.error('Error getting area technicians:', error);
    throw error;
  }
};

/**
 * Get technician workload (number of active complaints)
 */
const getTechnicianWorkload = async (technicianId) => {
  try {
    const activeComplaintsCount = await Complaint.count({
      where: {
        assignedTo: technicianId,
        status: ['open', 'in_progress']
      }
    });
    
    return activeComplaintsCount;
  } catch (error) {
    console.error('Error getting technician workload:', error);
    throw error;
  }
};

/**
 * Get all technicians in an area with their workload
 */
const getAreaTechniciansWithWorkload = async (areaId) => {
  try {
    const technicians = await getAreaTechnicians(areaId);
    
    const techniciansWithWorkload = await Promise.all(
      technicians.map(async (technician) => {
        const workload = await getTechnicianWorkload(technician.id);
        return {
          ...technician.toJSON(),
          activeComplaints: workload
        };
      })
    );
    
    // Sort by workload (least busy first)
    return techniciansWithWorkload.sort((a, b) => a.activeComplaints - b.activeComplaints);
  } catch (error) {
    console.error('Error getting technicians with workload:', error);
    throw error;
  }
};

/**
 * Automatically assign the best available technician for a complaint
 */
const autoAssignTechnician = async (areaId) => {
  try {
    const availableTechnicians = await getAreaTechniciansWithWorkload(areaId);
    
    if (availableTechnicians.length === 0) {
      console.warn(`No technicians available for area ${areaId}`);
      return null;
    }
    
    // Select the technician with the least workload
    const selectedTechnician = availableTechnicians[0];
    
    console.log(`🔧 Auto-assigned technician ${selectedTechnician.username} (${selectedTechnician.activeComplaints} active complaints)`);
    
    return selectedTechnician;
  } catch (error) {
    console.error('Error auto-assigning technician:', error);
    throw error;
  }
};

/**
 * Assign a manager to an area
 */
const assignManagerToArea = async (areaId, managerId) => {
  try {
    const area = await Area.findByPk(areaId);
    if (!area) {
      throw new Error('Area not found');
    }
    
    const manager = await User.findOne({
      where: { id: managerId, role: 'Manager' }
    });
    
    if (!manager) {
      throw new Error('Manager not found or user is not a manager');
    }
    
    await area.update({ manager_id: managerId });
    
    return {
      success: true,
      message: `Manager ${manager.username} assigned to area ${area.name}`
    };
  } catch (error) {
    console.error('Error assigning manager to area:', error);
    throw error;
  }
};

/**
 * Get all areas with their assigned managers
 */
const getAllAreasWithManagers = async (companyId) => {
  try {
    const areas = await Area.findAll({
      where: { company_id: companyId },
      include: [{
        model: User,
        as: 'manager',
        attributes: ['id', 'username', 'email', 'phone', 'name'],
        required: false
      }],
      order: [['name', 'ASC']]
    });
    
    return areas;
  } catch (error) {
    console.error('Error getting areas with managers:', error);
    throw error;
  }
};

/**
 * Reassign complaint to different technician (manager override)
 */
const reassignComplaint = async (complaintId, newTechnicianId, managerId) => {
  try {
    const complaint = await Complaint.findByPk(complaintId);
    if (!complaint) {
      throw new Error('Complaint not found');
    }
    
    // Verify the new technician exists and is in the same area
    const newTechnician = await User.findOne({
      where: {
        id: newTechnicianId,
        role: 'Technician',
        status: 'active'
      }
    });
    
    if (!newTechnician) {
      throw new Error('Technician not found or not active');
    }
    
    // Get the area of the complaint to verify technician is in same area
    const complaintArea = await Area.findOne({
      where: { company_id: complaint.company_id }
    });
    
    if (newTechnician.companyId !== complaintArea.id) {
      throw new Error('Technician must be from the same area as the complaint');
    }
    
    const oldTechnicianId = complaint.assignedTo;
    
    // Update the complaint assignment
    await complaint.update({
      assignedTo: newTechnicianId,
      assigned_at: new Date(),
      sla_deadline: new Date(Date.now() + (24 * 60 * 60 * 1000)), // Reset SLA timer
      sla_status: 'pending'
    });
    
    // Log the reassignment
    const activityLogService = require('./activityLog.service');
    await activityLogService.logActivity(
      managerId,
      'reassign_complaint',
      'complaint',
      `Complaint #${complaintId} reassigned from technician ${oldTechnicianId} to ${newTechnicianId}`
    );
    
    return {
      success: true,
      message: `Complaint reassigned to ${newTechnician.username}`,
      oldTechnicianId,
      newTechnicianId
    };
  } catch (error) {
    console.error('Error reassigning complaint:', error);
    throw error;
  }
};

module.exports = {
  getAreaManager,
  getAreaTechnicians,
  getTechnicianWorkload,
  getAreaTechniciansWithWorkload,
  autoAssignTechnician,
  assignManagerToArea,
  getAllAreasWithManagers,
  reassignComplaint
};
