const { Complaint, User, Area, Customer } = require('../models');
const { Op } = require('sequelize');
const notificationService = require('./notification.service');
const emailService = require('./email.service');

class ComplaintRoutingService {
  constructor() {
    this.technicianWorkloadCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Main routing function - handles complete complaint workflow
   */
  async routeComplaint(complaintId) {
    try {
      console.log(`🔄 Starting complaint routing for complaint ${complaintId}`);
      
      // Get complaint with area information
      const complaint = await Complaint.findByPk(complaintId, {
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'name', 'email', 'phone', 'area_id']
          },
          {
            model: Area,
            as: 'companyArea',
            attributes: ['id', 'name', 'manager_id'],
            include: [{
              model: User,
              as: 'manager',
              attributes: ['id', 'email', 'phone', 'username']
            }]
          }
        ]
      });

      if (!complaint) {
        throw new Error('Complaint not found');
      }

      // Get area information from complaint or customer
      const areaId = complaint.companyArea?.id || complaint.customer?.area_id;
      
      if (!areaId) {
        throw new Error('No area assigned to complaint');
      }

      console.log(`📍 Complaint area: ${areaId}`);

      // Step 1: Get area manager
      const areaManager = await this.getAreaManager(areaId);
      
      if (!areaManager) {
        console.warn(`⚠️ No manager assigned to area ${areaId}`);
        await this.notifyAdminForMissingManager(areaId, complaint);
      }

      // Step 2: Auto-assign to best available technician
      const assignmentResult = await this.autoAssignTechnician(complaintId, areaId);
      
      // Step 3: Send notifications
      await this.sendRoutingNotifications(complaint, areaManager, assignmentResult);

      // Step 4: Update complaint status
      if (assignmentResult.success) {
        await Complaint.update(
          { 
            status: 'in_progress',
            assigned_at: new Date(),
            sla_deadline: this.calculateSLADeadline()
          },
          { where: { id: complaintId } }
        );
      }

      return {
        success: true,
        complaintId,
        areaId,
        areaManager,
        technicianAssignment: assignmentResult,
        routingComplete: true
      };

    } catch (error) {
      console.error('❌ Complaint routing failed:', error);
      throw error;
    }
  }

  /**
   * Get area manager with full details
   */
  async getAreaManager(areaId) {
    try {
      const area = await Area.findOne({
        where: { id: areaId },
        include: [{
          model: User,
          as: 'manager',
          where: { role: 'Manager', status: 'active' },
          required: false,
          attributes: ['id', 'email', 'phone', 'username']
        }]
      });

      return area?.manager || null;
    } catch (error) {
      console.error('Error getting area manager:', error);
      throw error;
    }
  }

  /**
   * Auto-assign complaint to best available technician in the area
   */
  async autoAssignTechnician(complaintId, areaId) {
    try {
      console.log(`🔍 Finding available technicians in area ${areaId}`);

      // Get all active technicians in the area
      const technicians = await User.findAll({
        where: {
          role: 'Technician',
          status: 'active',
          companyId: areaId
        },
        attributes: ['id', 'email', 'phone', 'username']
      });

      if (technicians.length === 0) {
        return {
          success: false,
          message: 'No technicians available in this area',
          requiresManualAssignment: true,
          areaId
        };
      }

      console.log(`👥 Found ${technicians.length} technicians in area`);

      // Get workload for each technician
      const technicianWorkloads = await Promise.all(
        technicians.map(async (technician) => {
          const workload = await this.getTechnicianWorkload(technician.id);
          return {
            technician,
            workload
          };
        })
      );

      // Sort by workload (least busy first)
      technicianWorkloads.sort((a, b) => a.workload - b.workload);

      // Assign to technician with lowest workload
      const bestTechnician = technicianWorkloads[0].technician;
      const workload = technicianWorkloads[0].workload;

      console.log(`✅ Assigning to technician: ${bestTechnician.name} (current workload: ${workload})`);

      // Update complaint with technician assignment
      await Complaint.update(
        { assignedTo: bestTechnician.id },
        { where: { id: complaintId } }
      );

      // Update cache
      this.technicianWorkloadCache.set(bestTechnician.id, workload + 1);

      return {
        success: true,
        technician: bestTechnician,
        workload: workload + 1,
        assignmentTime: new Date()
      };

    } catch (error) {
      console.error('Error auto-assigning technician:', error);
      return {
        success: false,
        message: error.message,
        requiresManualAssignment: true
      };
    }
  }

  /**
   * Get technician's current workload (active complaints)
   */
  async getTechnicianWorkload(technicianId) {
    try {
      // Check cache first
      if (this.technicianWorkloadCache.has(technicianId)) {
        return this.technicianWorkloadCache.get(technicianId);
      }

      const workload = await Complaint.count({
        where: {
          assignedTo: technicianId,
          status: ['open', 'in_progress']
        }
      });

      // Update cache
      this.technicianWorkloadCache.set(technicianId, workload);

      // Clear cache after timeout
      setTimeout(() => {
        this.technicianWorkloadCache.delete(technicianId);
      }, this.cacheTimeout);

      return workload;
    } catch (error) {
      console.error('Error getting technician workload:', error);
      return 999; // Return high number to avoid assignment
    }
  }

  /**
   * Send notifications to manager and technician
   */
  async sendRoutingNotifications(complaint, areaManager, technicianAssignment) {
    const notifications = [];

    // Notify area manager
    if (areaManager) {
      const managerNotification = {
        type: 'complaint_assigned',
        recipient: areaManager,
        data: {
          complaintId: complaint.id,
          complaintTitle: complaint.title,
          customerName: complaint.customer?.name || complaint.name,
          area: complaint.companyArea?.name,
          priority: complaint.priority,
          technician: technicianAssignment.success ? technicianAssignment.technician : null,
          requiresManualAssignment: !technicianAssignment.success
        }
      };

      notifications.push(
        this.sendManagerNotification(managerNotification),
        this.sendManagerEmail(managerNotification)
      );
    }

    // Notify assigned technician
    if (technicianAssignment.success && technicianAssignment.technician) {
      const technicianNotification = {
        type: 'complaint_assigned',
        recipient: technicianAssignment.technician,
        data: {
          complaintId: complaint.id,
          complaintTitle: complaint.title,
          customerName: complaint.customer?.name || complaint.name,
          customerAddress: complaint.customer?.address || complaint.address,
          customerPhone: complaint.customer?.phone || complaint.whatsapp_number,
          area: complaint.companyArea?.name,
          priority: complaint.priority,
          manager: areaManager
        }
      };

      notifications.push(
        this.sendTechnicianNotification(technicianNotification),
        this.sendTechnicianEmail(technicianNotification)
      );
    }

    // Wait for all notifications to be sent
    await Promise.allSettled(notifications);
  }

  /**
   * Send in-app notification to manager
   */
  async sendManagerNotification(notification) {
    try {
      await notificationService.createNotification({
        userId: notification.recipient.id,
        type: 'complaint_assigned',
        title: 'New Complaint Assigned',
        message: `Complaint #${notification.data.complaintId} has been registered in your area: ${notification.data.complaintTitle}`,
        data: notification.data,
        priority: notification.data.priority === 'urgent' ? 'high' : 'medium'
      });
    } catch (error) {
      console.error('Error sending manager notification:', error);
    }
  }

  /**
   * Send email notification to manager
   */
  async sendManagerEmail(notification) {
    try {
      await emailService.sendComplaintAssignmentNotification(
        notification.recipient.email,
        notification.recipient.name,
        notification.data
      );
    } catch (error) {
      console.error('Error sending manager email:', error);
    }
  }

  /**
   * Send in-app notification to technician
   */
  async sendTechnicianNotification(notification) {
    try {
      await notificationService.createNotification({
        userId: notification.recipient.id,
        type: 'complaint_assigned',
        title: 'New Complaint Assigned',
        message: `You have been assigned a new complaint: ${notification.data.complaintTitle}`,
        data: notification.data,
        priority: notification.data.priority === 'urgent' ? 'high' : 'medium'
      });
    } catch (error) {
      console.error('Error sending technician notification:', error);
    }
  }

  /**
   * Send email notification to technician
   */
  async sendTechnicianEmail(notification) {
    try {
      await emailService.sendComplaintAssignmentNotification(
        notification.recipient.email,
        notification.recipient.name,
        notification.data
      );
    } catch (error) {
      console.error('Error sending technician email:', error);
    }
  }

  /**
   * Manager override - reassign complaint to different technician
   */
  async reassignComplaint(complaintId, newTechnicianId, managerId) {
    try {
      // Verify manager has authority for this area
      const complaint = await Complaint.findByPk(complaintId, {
        include: [
          {
            model: Area,
            as: 'companyArea',
            attributes: ['id', 'name', 'manager_id']
          }
        ]
      });

      if (!complaint) {
        throw new Error('Complaint not found');
      }

      if (complaint.companyArea?.manager_id !== managerId) {
        throw new Error('Manager not authorized for this area');
      }

      // Verify new technician is in the same area
      const newTechnician = await User.findOne({
        where: {
          id: newTechnicianId,
          role: 'Technician',
          status: 'active',
          companyId: complaint.companyArea.id
        }
      });

      if (!newTechnician) {
        throw new Error('Technician not found or not in the same area');
      }

      // Update complaint assignment
      await Complaint.update(
        { 
          assignedTo: newTechnicianId,
          status: 'in_progress',
          assigned_at: new Date()
        },
        { where: { id: complaintId } }
      );

      // Clear workload cache
      this.technicianWorkloadCache.clear();

      // Send notifications about reassignment
      await this.sendReassignmentNotifications(complaint, newTechnician);

      return {
        success: true,
        complaintId,
        previousTechnicianId: complaint.assignedTo,
        newTechnicianId,
        reassignedBy: managerId,
        reassignedAt: new Date()
      };

    } catch (error) {
      console.error('Error reassigning complaint:', error);
      throw error;
    }
  }

  /**
   * Send notifications about complaint reassignment
   */
  async sendReassignmentNotifications(complaint, newTechnician) {
    try {
      // Notify new technician
      await notificationService.createNotification({
        userId: newTechnician.id,
        type: 'complaint_reassigned',
        title: 'Complaint Reassigned',
        message: `Complaint #${complaint.id} has been reassigned to you: ${complaint.title}`,
        data: {
          complaintId: complaint.id,
          complaintTitle: complaint.title,
          reassignedAt: new Date()
        }
      });

      // Send email to new technician
      await emailService.sendComplaintReassignmentNotification(
        newTechnician.email,
        newTechnician.name,
        {
          complaintId: complaint.id,
          complaintTitle: complaint.title,
          customerName: complaint.name,
          reassignedAt: new Date()
        }
      );

    } catch (error) {
      console.error('Error sending reassignment notifications:', error);
    }
  }

  /**
   * Calculate SLA deadline based on priority
   */
  calculateSLADeadline() {
    const now = new Date();
    const deadlines = {
      low: 72, // 72 hours
      medium: 24, // 24 hours
      high: 8, // 8 hours
      urgent: 2 // 2 hours
    };

    // Default to medium priority
    const hours = deadlines.medium || 24;
    const deadline = new Date(now.getTime() + (hours * 60 * 60 * 1000));
    
    return deadline;
  }

  /**
   * Notify admin when no manager is assigned to an area
   */
  async notifyAdminForMissingManager(areaId, complaint) {
    try {
      const adminUsers = await User.findAll({
        where: {
          role: ['CEO', 'Manager'],
          status: 'active'
        },
        limit: 3 // Limit to avoid spam
      });

      for (const admin of adminUsers) {
        await notificationService.createNotification({
          userId: admin.id,
          type: 'missing_manager',
          title: 'Area Manager Missing',
          message: `No manager assigned to area for complaint #${complaint.id}`,
          data: {
            areaId,
            complaintId: complaint.id,
            complaintTitle: complaint.title
          },
          priority: 'high'
        });
      }
    } catch (error) {
      console.error('Error notifying admin about missing manager:', error);
    }
  }

  /**
   * Get available technicians for an area (for manager override UI)
   */
  async getAvailableTechnicians(areaId) {
    try {
      const technicians = await User.findAll({
        where: {
          role: 'Technician',
          status: 'active',
          companyId: areaId
        },
        attributes: ['id', 'email', 'phone', 'username'],
        include: [{
          model: Complaint,
          as: 'assignedComplaints',
          where: {
            status: ['open', 'in_progress']
          },
          required: false,
          attributes: ['id']
        }]
      });

      // Add workload count
      return technicians.map(technician => ({
        ...technician.toJSON(),
        workload: technician.assignedComplaints?.length || 0
      }));

    } catch (error) {
      console.error('Error getting available technicians:', error);
      throw error;
    }
  }
}

module.exports = new ComplaintRoutingService();
