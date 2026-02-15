const models = require('../models');
const { User } = models;

/**
 * Send notification to area manager about new complaint
 */
const notifyManagerAboutNewComplaint = async (areaId, complaintData) => {
  try {
    const areaManagementService = require('./areaManagement.service');
    const manager = await areaManagementService.getAreaManager(areaId);
    
    if (!manager) {
      console.warn(`No manager assigned to area ${areaId}`);
      return { success: false, message: 'No manager assigned to area' };
    }
    
    // Send email notification
    if (manager.email) {
      const emailService = require('./email.service');
      await emailService.sendNewComplaintNotification(
        manager.email,
        manager.username,
        complaintData
      );
    }
    
    // Send WhatsApp notification if phone number available
    if (manager.phone) {
      const whatsappService = require('./whatsapp.service');
      await whatsappService.sendComplaintNotification(
        manager.phone,
        `New Complaint Alert: ${complaintData.title}\nCustomer: ${complaintData.name}\nArea: ${complaintData.area}\nPriority: ${complaintData.priority}`
      );
    }
    
    console.log(`📧 Manager ${manager.username} notified about new complaint ${complaintData.id}`);
    
    return {
      success: true,
      manager: manager.username,
      notificationMethods: ['email', 'whatsapp'].filter(method => 
        method === 'email' ? manager.email : manager.phone
      )
    };
  } catch (error) {
    console.error('Error notifying manager:', error);
    throw error;
  }
};

/**
 * Send notification to technician about complaint assignment
 */
const notifyTechnicianAboutAssignment = async (technicianId, complaintData, assignedBy = null) => {
  try {
    const technician = await User.findByPk(technicianId, {
      attributes: ['id', 'username', 'email', 'phone']
    });
    
    if (!technician) {
      throw new Error('Technician not found');
    }
    
    // Send email notification
    if (technician.email) {
      const emailService = require('./email.service');
      await emailService.sendComplaintAssignmentNotification(
        technician.email,
        technician.username,
        complaintData,
        assignedBy
      );
    }
    
    // Send WhatsApp notification if phone number available
    if (technician.phone) {
      const whatsappService = require('./whatsapp.service');
      await whatsappService.sendComplaintNotification(
        technician.phone,
        `New Complaint Assigned: ${complaintData.title}\nCustomer: ${complaintData.name}\nPriority: ${complaintData.priority}\nAssigned by: ${assignedBy || 'System'}`
      );
    }
    
    console.log(`🔧 Technician ${technician.username} notified about complaint assignment ${complaintData.id}`);
    
    return {
      success: true,
      technician: technician.username,
      notificationMethods: ['email', 'whatsapp'].filter(method => 
        method === 'email' ? technician.email : technician.phone
      )
    };
  } catch (error) {
    console.error('Error notifying technician:', error);
    throw error;
  }
};

/**
 * Send notification about complaint status update
 */
const notifyStatusUpdate = async (complaintId, newStatus, customerId = null) => {
  try {
    const complaintService = require('./complaint.service');
    const complaint = await complaintService.getAll(null, null); // Get all complaints
    const complaintData = complaint.find(c => c.id === complaintId);
    
    if (!complaintData) {
      throw new Error('Complaint not found');
    }
    
    // Notify customer if customerId is provided
    if (customerId) {
      const { Customer } = require('../models');
      const customer = await Customer.findByPk(customerId, {
        attributes: ['email', 'phone', 'name']
      });
      
      if (customer && customer.email) {
        const emailService = require('./email.service');
        await emailService.sendComplaintStatusUpdateNotification(
          customer.email,
          customer.name,
          complaintData,
          complaintData.status,
          newStatus
        );
      }
      
      if (customer && customer.phone) {
        const whatsappService = require('./whatsapp.service');
        await whatsappService.sendComplaintNotification(
          customer.phone,
          `Complaint Status Update: ${complaintData.title}\nStatus changed to: ${newStatus.toUpperCase()}\nThank you for your patience.`
        );
      }
    }
    
    // Notify assigned technician if status is being updated by manager
    if (complaintData.assignedTo && newStatus !== 'closed') {
      await notifyTechnicianAboutAssignment(
        complaintData.assignedTo,
        complaintData,
        'System Status Update'
      );
    }
    
    console.log(`📢 Status update notifications sent for complaint ${complaintId}`);
    
    return {
      success: true,
      complaintId,
      newStatus,
      notifiedCustomer: !!customerId,
      notifiedTechnician: !!complaintData.assignedTo
    };
  } catch (error) {
    console.error('Error sending status update notifications:', error);
    throw error;
  }
};

/**
 * Send notification about complaint reassignment
 */
const notifyReassignment = async (complaintId, oldTechnicianId, newTechnicianId, reassignedBy) => {
  try {
    const complaintService = require('./complaint.service');
    const complaint = await complaintService.getAll(null, null);
    const complaintData = complaint.find(c => c.id === complaintId);
    
    if (!complaintData) {
      throw new Error('Complaint not found');
    }
    
    // Notify new technician
    if (newTechnicianId) {
      await notifyTechnicianAboutAssignment(
        newTechnicianId,
        complaintData,
        `${reassignedBy} (Reassignment)`
      );
    }
    
    // Notify old technician about reassignment
    if (oldTechnicianId) {
      const oldTechnician = await User.findByPk(oldTechnicianId, {
        attributes: ['username', 'email', 'phone']
      });
      
      if (oldTechnician) {
        const emailService = require('./email.service');
        const whatsappService = require('./whatsapp.service');
        
        if (oldTechnician.email) {
          await emailService.sendReassignmentNotification(
            oldTechnician.email,
            oldTechnician.username,
            complaintData,
            reassignedBy
          );
        }
        
        if (oldTechnician.phone) {
          await whatsappService.sendComplaintNotification(
            oldTechnician.phone,
            `Complaint Reassigned: ${complaintData.title}\nThis complaint has been reassigned to another technician.\nReassigned by: ${reassignedBy}`
          );
        }
      }
    }
    
    console.log(`🔄 Reassignment notifications sent for complaint ${complaintId}`);
    
    return {
      success: true,
      complaintId,
      oldTechnicianId,
      newTechnicianId,
      reassignedBy
    };
  } catch (error) {
    console.error('Error sending reassignment notifications:', error);
    throw error;
  }
};

/**
 * Send notification when no technicians are available
 */
const notifyNoTechniciansAvailable = async (areaId, complaintData) => {
  try {
    const areaManagementService = require('./areaManagement.service');
    const manager = await areaManagementService.getAreaManager(areaId);
    
    if (!manager) {
      console.warn(`No manager assigned to area ${areaId} for no-technician alert`);
      return { success: false, message: 'No manager assigned to area' };
    }
    
    // Send urgent notification to manager
    if (manager.email) {
      const emailService = require('./email.service');
      await emailService.sendUrgentNotification(
        manager.email,
        `URGENT: No Technicians Available`,
        `A new complaint requires manual assignment:\n\nComplaint: ${complaintData.title}\nCustomer: ${complaintData.name}\nArea: ${complaintData.area}\nPriority: ${complaintData.priority}\n\nNo technicians are currently available in this area. Please assign manually.`
      );
    }
    
    if (manager.phone) {
      const whatsappService = require('./whatsapp.service');
      await whatsappService.sendComplaintNotification(
        manager.phone,
        `🚨 URGENT: No technicians available for new complaint in ${complaintData.area}. Priority: ${complaintData.priority}. Please assign manually.`
      );
    }
    
    console.log(`🚨 Manager ${manager.username} notified about no available technicians`);
    
    return {
      success: true,
      manager: manager.username,
      message: 'Manager notified about technician shortage'
    };
  } catch (error) {
    console.error('Error notifying about no technicians available:', error);
    throw error;
  }
};

module.exports = {
  notifyManagerAboutNewComplaint,
  notifyTechnicianAboutAssignment,
  notifyStatusUpdate,
  notifyReassignment,
  notifyNoTechniciansAvailable
};
