const { Complaint } = require('../models');
const ActivityLogService = require('./activityLog.service');

class ComplaintService {
  static async create(data, userId) {
    const complaint = await Complaint.create({
      ...data,
      status: 'open'
    });
    ActivityLogService.logActivity(userId, 'create_complaint', 'complaint', `Complaint #${complaint.id}`);
    return complaint;
  }

  static async getAll() {
    return Complaint.findAll({
      include: [
        { model: require('../models').Customer },
        { model: require('../models').Connection },
        { model: require('../models').User, as: 'Assignee' }
      ],
      order: [['created_at', 'DESC']]
    });
  }

  static async update(id, data, userId) {
    const complaint = await Complaint.findByPk(id);
    if (!complaint) throw new Error('Complaint not found');
    await complaint.update(data);
    ActivityLogService.logActivity(userId, 'update_complaint', 'complaint', `Updated complaint #${id}`);
    return complaint;
  }
}

module.exports = ComplaintService;