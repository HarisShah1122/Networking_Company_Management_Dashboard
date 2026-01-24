const { ActivityLog } = require('../models');

const logActivity = async (userId, action, model, description) => {
  try {
    return await ActivityLog.create({
      user_id: userId,
      action,
      model: model || 'unknown',
      description: description || ''
    });
  } catch (error) {
    return null;
  }
};

const getUserActivities = async (userId, options = {}) => {
  const { limit = 50, offset = 0 } = options;
  
  return await ActivityLog.findAll({
    where: { user_id: userId },
    order: [['timestamp', 'DESC']],
    limit,
    offset
  });
};

module.exports = {
  logActivity,
  getUserActivities
};
