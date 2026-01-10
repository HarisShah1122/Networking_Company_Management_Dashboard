const ActivityLogService = require('./activityLog.service');

const create = async (data, userId) => {
  try {
    const { Complaint } = require('../models');
    const complaint = await Complaint.create({
      ...data,
      status: 'open'
    });
    ActivityLogService.logActivity(userId, 'create_complaint', 'complaint', `Complaint #${complaint.id}`);
    return complaint;
  } catch (error) {
    throw error;
  }
};

const getAll = async () => {
  try {
    const { Complaint, Customer, Connection, User } = require('../models');
    return await Complaint.findAll({
      include: [
        { model: Customer },
        { model: Connection },
        { model: User, as: 'Assignee' }
      ],
      order: [['created_at', 'DESC']]
    });
  } catch (error) {
    throw error;
  }
};

const update = async (id, data, userId) => {
  try {
    const { Complaint } = require('../models');
    const complaint = await Complaint.findByPk(id);
    if (!complaint) throw new Error('Complaint not found');
    await complaint.update(data);
    ActivityLogService.logActivity(userId, 'update_complaint', 'complaint', `Updated complaint #${id}`);
    return complaint;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  create,
  getAll,
  update
};