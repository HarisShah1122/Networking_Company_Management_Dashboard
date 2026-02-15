const { Complaint, SLAPenalty, sequelize } = require('../models');
const { Op } = require('sequelize');

const SLA_HOURS = 24;
const PENALTY_AMOUNT = 500;

class SLAService {
  /**
   * Start SLA timer when complaint is assigned to technician
   */
  static async startSLATimer(complaintId, technicianId) {
    try {
      const complaint = await Complaint.findByPk(complaintId);
      if (!complaint) {
        throw new Error('Complaint not found');
      }

      const now = new Date();
      const slaDeadline = new Date(now.getTime() + (SLA_HOURS * 60 * 60 * 1000));

      await complaint.update({
        assigned_to: technicianId,
        assigned_at: now,
        sla_deadline: slaDeadline,
        sla_status: 'pending'
      });

      console.log(`🕒 SLA timer started for complaint ${complaintId}. Deadline: ${slaDeadline}`);
      
      return {
        assigned_at: now,
        sla_deadline: slaDeadline,
        sla_status: 'pending'
      };
    } catch (error) {
      console.error('Error starting SLA timer:', error);
      throw error;
    }
  }

  /**
   * Check and update SLA status for a single complaint
   */
  static async checkSLAStatus(complaintId) {
    try {
      const complaint = await Complaint.findByPk(complaintId);
      if (!complaint || !complaint.assigned_at || complaint.status === 'closed') {
        return null;
      }

      const now = new Date();
      const deadline = new Date(complaint.sla_deadline);
      const isOverdue = now > deadline;

      let newStatus = complaint.sla_status;
      
      if (complaint.status === 'closed') {
        // Complaint was resolved, check if it was within SLA
        newStatus = isOverdue ? 'breached' : 'met';
      } else if (isOverdue && complaint.sla_status !== 'breached' && complaint.sla_status !== 'pending_penalty') {
        // SLA breached but not yet marked for penalty
        newStatus = 'pending_penalty';
      }

      if (newStatus !== complaint.sla_status) {
        await complaint.update({ sla_status: newStatus });
        console.log(`📊 SLA status updated for complaint ${complaintId}: ${complaint.sla_status} → ${newStatus}`);
        
        // If status changed to pending_penalty, create penalty record
        if (newStatus === 'pending_penalty') {
          await this.createPenalty(complaint);
        }
      }

      return {
        complaint_id: complaintId,
        sla_status: newStatus,
        sla_deadline: complaint.sla_deadline,
        is_overdue: isOverdue
      };
    } catch (error) {
      console.error('Error checking SLA status:', error);
      throw error;
    }
  }

  /**
   * Create penalty record for SLA breach
   */
  static async createPenalty(complaint) {
    try {
      // Check if penalty already exists
      const existingPenalty = await SLAPenalty.findOne({
        where: {
          complaintId: complaint.id,
          status: { [Op.notIn]: ['waived'] }
        }
      });

      if (existingPenalty) {
        console.log(`⚠️ Penalty already exists for complaint ${complaint.id}`);
        return existingPenalty;
      }

      const now = new Date();
      const assignedAt = new Date(complaint.assigned_at);
      const deadline = new Date(complaint.sla_deadline);
      const breachDuration = (now - deadline) / (1000 * 60 * 60); // hours

      const penalty = await SLAPenalty.create({
        complaintId: complaint.id,
        technicianId: complaint.assigned_to,
        companyId: complaint.company_id,
        amount: PENALTY_AMOUNT,
        assigned_at: assignedAt,
        sla_deadline: deadline,
        breach_duration_hours: breachDuration,
        status: 'pending'
      });

      console.log(`💰 PKR ${PENALTY_AMOUNT} penalty created for technician ${complaint.assigned_to} on complaint ${complaint.id}`);
      
      return penalty;
    } catch (error) {
      console.error('Error creating penalty:', error);
      throw error;
    }
  }

  /**
   * Apply penalty to technician (mark as applied)
   */
  static async applyPenalty(penaltyId) {
    try {
      const penalty = await SLAPenalty.findByPk(penaltyId);
      if (!penalty || penalty.status !== 'pending') {
        throw new Error('Penalty not found or already processed');
      }

      await penalty.update({
        status: 'applied',
        applied_at: new Date()
      });

      // Update complaint penalty status
      await Complaint.update(
        { 
          penalty_applied: true,
          penalty_amount: penalty.amount,
          penalty_applied_at: new Date()
        },
        { where: { id: penalty.complaintId } }
      );

      console.log(`✅ Penalty PKR ${penalty.amount} applied for complaint ${penalty.complaintId}`);
      
      return penalty;
    } catch (error) {
      console.error('Error applying penalty:', error);
      throw error;
    }
  }

  /**
   * Check all overdue complaints and create penalties
   * This is meant to be run by a cron job
   */
  static async checkOverdueComplaints() {
    try {
      console.log('🔍 Checking for overdue complaints...');
      
      const now = new Date();
      
      // Find complaints that are:
      // 1. Assigned to a technician
      // 2. Past their SLA deadline
      // 3. Not already breached or penalized
      // 4. Not closed
      const overdueComplaints = await Complaint.findAll({
        where: {
          assigned_to: { [Op.not]: null },
          sla_deadline: { [Op.lt]: now },
          sla_status: { [Op.notIn]: ['breached', 'pending_penalty'] },
          status: { [Op.not]: 'closed' }
        }
      });

      console.log(`📊 Found ${overdueComplaints.length} overdue complaints`);

      const results = [];
      for (const complaint of overdueComplaints) {
        try {
          const result = await this.checkSLAStatus(complaint.id);
          results.push(result);
        } catch (error) {
          console.error(`Error processing complaint ${complaint.id}:`, error);
          results.push({ error: error.message, complaint_id: complaint.id });
        }
      }

      console.log(`✅ Processed ${results.length} overdue complaints`);
      return results;
    } catch (error) {
      console.error('Error in checkOverdueComplaints:', error);
      throw error;
    }
  }

  /**
   * Get SLA statistics for a company
   */
  static async getSLAStats(companyId, areaId = null) {
    try {
      const whereClause = {
        company_id: companyId,
        assigned_to: { [Op.not]: null }
      };

      if (areaId) {
        whereClause.area = areaId;
      }

      const complaints = await Complaint.findAll({ where: whereClause });

      const stats = {
        total_assigned: complaints.length,
        pending_sla: complaints.filter(c => c.sla_status === 'pending').length,
        sla_met: complaints.filter(c => c.sla_status === 'met').length,
        sla_breached: complaints.filter(c => c.sla_status === 'breached').length,
        pending_penalties: complaints.filter(c => c.sla_status === 'pending_penalty').length,
        penalties_applied: complaints.filter(c => c.penalty_applied).length,
        total_penalties: complaints.reduce((sum, c) => sum + parseFloat(c.penalty_amount || 0), 0)
      };

      stats.sla_compliance_rate = stats.total_assigned > 0 
        ? ((stats.sla_met / stats.total_assigned) * 100).toFixed(2)
        : 0;

      return stats;
    } catch (error) {
      console.error('Error getting SLA stats:', error);
      throw error;
    }
  }

  /**
   * Get penalties for a technician
   */
  static async getTechnicianPenalties(technicianId, companyId) {
    try {
      const penalties = await SLAPenalty.findAll({
        where: {
          technicianId,
          companyId
        },
        order: [['created_at', 'DESC']]
      });

      return penalties;
    } catch (error) {
      console.error('Error getting technician penalties:', error);
      throw error;
    }
  }
}

module.exports = SLAService;
