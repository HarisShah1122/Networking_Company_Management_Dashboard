const { ActivityLog } = require('../models');

class ActivityLogService {
  static async logActivity(userId, action, module, details) {
    try {
      return await ActivityLog.create({
        user_id: userId,
        action,
        module,
        details
      });
    } catch (error) {
      // Log error but don't throw - activity logging should not break main flow
      console.error('Error logging activity:', error);
      return null;
    }
  }

  static async getUserActivities(userId, options = {}) {
    const { limit = 50, offset = 0 } = options;
    
    return await ActivityLog.findAll({
      where: { user_id: userId },
      order: [['timestamp', 'DESC']],
      limit,
      offset
    });
  }
}

module.exports = ActivityLogService;

