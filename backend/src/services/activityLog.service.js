const { ActivityLog } = require('../models');

class ActivityLogService {
  static async logActivity(userId, action, model, description) {
    try {
      return await ActivityLog.create({
        user_id: userId,
        action,
        model: model || 'unknown',
        description: description || ''
      });
    } catch (error) {
      // Silently fail - activity logging should not break main flow or show errors
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

