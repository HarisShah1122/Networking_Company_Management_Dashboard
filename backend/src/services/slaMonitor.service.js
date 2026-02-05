const cron = require('node-cron');
const SLAService = require('../services/sla.service');

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
      console.log('⚠️ SLA Monitor is already running');
      return;
    }

    console.log('🚀 Starting SLA Monitor...');

    // Check overdue complaints every 5 minutes
    const overdueCheckTask = cron.schedule('*/5 * * * *', async () => {
      try {
        console.log('⏰ Running overdue complaints check...');
        await SLAService.checkOverdueComplaints();
      } catch (error) {
        console.error('❌ Error in overdue complaints check:', error);
      }
    }, {
      scheduled: false
    });

    // Apply pending penalties every 10 minutes
    const penaltyApplicationTask = cron.schedule('*/10 * * * *', async () => {
      try {
        console.log('💰 Running penalty application check...');
        await this.applyPendingPenalties();
      } catch (error) {
        console.error('❌ Error in penalty application check:', error);
      }
    }, {
      scheduled: false
    });

    // Daily SLA report at 9 AM
    const dailyReportTask = cron.schedule('0 9 * * *', async () => {
      try {
        console.log('📊 Generating daily SLA report...');
        await this.generateDailyReport();
      } catch (error) {
        console.error('❌ Error generating daily SLA report:', error);
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
      console.log(`✅ Started SLA monitoring task: ${name}`);
    });

    this.isRunning = true;
    console.log('🎯 SLA Monitor started successfully');
  }

  /**
   * Stop all SLA monitoring tasks
   */
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ SLA Monitor is not running');
      return;
    }

    console.log('🛑 Stopping SLA Monitor...');

    this.tasks.forEach(({ name, task }) => {
      task.stop();
      console.log(`⏹️ Stopped SLA monitoring task: ${name}`);
    });

    this.tasks = [];
    this.isRunning = false;
    console.log('✅ SLA Monitor stopped');
  }

  /**
   * Apply pending penalties
   */
  async applyPendingPenalties() {
    try {
      const { SLAPenalty } = require('../models');
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
      const { Company } = require('../models');
      
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
