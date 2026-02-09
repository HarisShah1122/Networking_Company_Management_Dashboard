const cron = require('node-cron');
const SLAService = require('../services/sla.service');
const { SLAPenalty, Complaint, Company } = require('../models');

class SLAMonitor {
  constructor() {
    this.isRunning = false;
    this.tasks = [];
  }

  /**
   * Start all SLA monitoring tasks
   */
  start() {
    if (this.isRunning) {
      return;
    }


    // Check overdue complaints every 5 minutes
    const overdueCheckTask = cron.schedule('*/5 * * * *', async () => {
      try {
        await SLAService.checkOverdueComplaints();
      } catch (error) {
        // Error in overdue complaints check
      }
    }, {
      scheduled: false
    });

    // Apply pending penalties every 10 minutes
    const penaltyApplicationTask = cron.schedule('*/10 * * * *', async () => {
      try {
        await this.applyPendingPenalties();
      } catch (error) {
        // Error in penalty application check
      }
    }, {
      scheduled: false
    });

    // Daily SLA report at 9 AM
    const dailyReportTask = cron.schedule('0 9 * * *', async () => {
      try {
        await this.generateDailyReport();
      } catch (error) {
        // Error generating daily SLA report
      }
    }, {
      scheduled: false
    });

    this.tasks = [
      { name: 'overdue-check', task: overdueCheckTask },
      { name: 'penalty-application', task: penaltyApplicationTask },
      { name: 'daily-report', task: dailyReportTask }
    ];

    // Start all tasks
    this.tasks.forEach(({ name, task }) => {
      task.start();
    });

    this.isRunning = true;
  }

  /**
   * Stop all SLA monitoring tasks
   */
  stop() {
    if (!this.isRunning) {
      return;
    }


    this.tasks.forEach(({ name, task }) => {
      task.stop();
    });

    this.tasks = [];
    this.isRunning = false;
  }

  /**
   * Apply pending penalties
   */
  async applyPendingPenalties() {
    try {
      const { Op } = require('sequelize');

      // Find penalties that are pending and older than 5 minutes (grace period)
      const gracePeriod = new Date(Date.now() - 5 * 60 * 1000);
      
      const pendingPenalties = await SLAPenalty.findAll({
        where: {
          status: 'pending',
          created_at: { [Op.lt]: gracePeriod }
        }
      });

      console.log(`💰 Found ${pendingPenalties.length} pending penalties to apply`);

      for (const penalty of pendingPenalties) {
        try {
          await SLAService.applyPenalty(penalty.id);
        } catch (error) {
          console.error(`Error applying penalty ${penalty.id}:`, error);
        }
      }

      return pendingPenalties.length;
    } catch (error) {
      console.error('Error applying pending penalties:', error);
      throw error;
    }
  }

  /**
   * Generate daily SLA report
   */
  async generateDailyReport() {
    try {
      
      const companies = await Company.findAll();
      
      for (const company of companies) {
        try {
          const stats = await SLAService.getSLAStats(company.id);
          
          console.log(`📊 Daily SLA Report for ${company.name}:`);
          console.log(`   Total Assigned: ${stats.total_assigned}`);
          console.log(`   SLA Met: ${stats.sla_met}`);
          console.log(`   SLA Breached: ${stats.sla_breached}`);
          console.log(`   Compliance Rate: ${stats.sla_compliance_rate}%`);
          console.log(`   Total Penalties: PKR ${stats.total_penalties}`);
          console.log(`   Pending Penalties: ${stats.pending_penalties}`);
          console.log('---');
        } catch (error) {
          console.error(`Error generating report for company ${company.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error generating daily report:', error);
      throw error;
    }
  }

  /**
   * Get task status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      tasks: this.tasks.map(({ name, task }) => ({
        name,
        running: task.running || false
      }))
    };
  }

  /**
   * Manual trigger for overdue check (for testing)
   */
  async triggerOverdueCheck() {
    console.log('🔧 Manual trigger: Checking overdue complaints...');
    return await SLAService.checkOverdueComplaints();
  }

  /**
   * Manual trigger for penalty application (for testing)
   */
  async triggerPenaltyApplication() {
    console.log('🔧 Manual trigger: Applying pending penalties...');
    return await this.applyPendingPenalties();
  }
}

// Create singleton instance
const slaMonitor = new SLAMonitor();

module.exports = slaMonitor;
