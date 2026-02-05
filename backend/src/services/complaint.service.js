const activityLogService = require('./activityLog.service');
const models = require('../models');
const { Complaint, sequelize } = models;
const { fetchCustomerData } = require('../helpers/customerHelper');
const { randomUUID } = require('crypto');

if (!Complaint) throw new Error('Complaint model is not defined. Check models/index.js');

const create = async (data, userId, companyId) => {
  try {
    let name = data.name ?? null;
    let whatsapp_number = data.whatsapp_number ?? null;

    if ((!name || !whatsapp_number) && data.customerId) {
      const customerData = await fetchCustomerData(data.customerId);
      name = name ?? customerData.name ?? null;
      whatsapp_number = whatsapp_number ?? customerData.phone ?? customerData.whatsapp_number ?? null;
    }

    const complaintId = randomUUID();
    const now = new Date();

    const sqlFields = ['id','title','description','status','priority','name','whatsapp_number','company_id','created_at','updated_at'];
    const placeholders = ['?','?','?','?','?','?','?','?','?','?'];
    const values = [complaintId, data.title ?? '', data.description ?? '', data.status ?? 'open', data.priority ?? 'medium', name, whatsapp_number, companyId, now, now];

    if (data.customerId) { sqlFields.push('customer_id'); placeholders.push('?'); values.push(data.customerId); }
    if (data.connectionId) { sqlFields.push('connection_id'); placeholders.push('?'); values.push(data.connectionId); }
    if (data.assignedTo) { sqlFields.push('assigned_to'); placeholders.push('?'); values.push(data.assignedTo); }

    const sql = `INSERT INTO complaints (${sqlFields.join(',')}) VALUES (${placeholders.join(',')})`;

    const transaction = await sequelize.transaction();
    try {
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { transaction, type: sequelize.QueryTypes.RAW });
      await sequelize.query(sql, { replacements: values, type: sequelize.QueryTypes.INSERT, transaction });
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { transaction, type: sequelize.QueryTypes.RAW });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }

    const complaint = await Complaint.findByPk(complaintId);
    activityLogService.logActivity(userId, 'create_complaint', 'complaint', `Complaint #${complaintId}`);

    return {
      ...complaint.toJSON(),
      name,
      whatsapp_number
    };
  } catch (err) {
    throw err;
  }
};

const getAll = async (companyId) => {
  try {
    let whereClause = '';
    if (companyId) {
      whereClause = `WHERE company_id = '${companyId}'`;
    }
    
    const sql = `SELECT * FROM complaints ${whereClause} ORDER BY created_at DESC`;
    const complaints = await sequelize.query(sql, { type: sequelize.QueryTypes.SELECT });
    
    return Promise.all(complaints.map(async (c) => {
      const data = c;
      if (!data.name || !data.whatsapp_number) {
        const customerData = await fetchCustomerData(data.customerId);
        return { ...data, name: customerData.name ?? null, whatsapp_number: customerData.phone ?? customerData.whatsapp_number ?? null };
      }
      return data;
    }));
  } catch (err) {
    throw err;
  }
};

const update = async (id, data, userId, companyId) => {
  try {
    const whereClause = companyId ? { id, company_id: companyId } : { id };
    const complaint = await Complaint.findOne({ where: whereClause });
    if (!complaint) throw new Error('Complaint not found');

    const complaintData = complaint.toJSON();
    const customerId = data.customerId ?? complaintData.customerId;

    let name = data.name ?? complaintData.name ?? null;
    let whatsapp_number = data.whatsapp_number ?? complaintData.whatsapp_number ?? null;

    if ((!name || !whatsapp_number) && customerId) {
      const customerData = await fetchCustomerData(customerId);
      name = name ?? customerData.name ?? null;
      whatsapp_number = whatsapp_number ?? customerData.phone ?? customerData.whatsapp_number ?? null;
    }

    const updateData = {
      title: data.title ?? complaintData.title,
      description: data.description ?? complaintData.description,
      status: data.status ?? complaintData.status,
      priority: data.priority ?? complaintData.priority,
      name,
      whatsapp_number
    };

    if (customerId) updateData.customerId = customerId;
    if (data.connectionId !== undefined) updateData.connectionId = data.connectionId ?? complaintData.connectionId;
    if (data.assignedTo !== undefined) updateData.assignedTo = data.assignedTo ?? complaintData.assignedTo;

    await complaint.update(updateData);
    activityLogService.logActivity(userId, 'update_complaint', 'complaint', `Updated complaint #${id}`);

    return { ...complaint.toJSON(), name, whatsapp_number };
  } catch (err) {
    throw err;
  }
};

const deleteComplaint = async (id, userId, companyId) => {
  try {
    const whereClause = companyId ? { id, company_id: companyId } : { id };
    const complaint = await Complaint.findOne({ where: whereClause });
    if (!complaint) throw new Error('Complaint not found');
    await complaint.destroy();
    activityLogService.logActivity(userId, 'delete_complaint', 'complaint', `Deleted complaint #${id}`);
    return true;
  } catch (err) {
    throw err;
  }
};

const getStatusStats = async (companyId) => {
  const whereClause = companyId ? { company_id: companyId } : {};
  
  const rows = await Complaint.findAll({
    where: whereClause,
    attributes: ['status',[sequelize.fn('COUNT',sequelize.col('id')),'count']],
    group: ['status'],
    raw: true
  });

  const stats = { open:0, in_progress:0, resolved:0, closed:0 };
  rows.forEach(r => {
    const status = r.status;
    const count = parseInt(r.count,10) || 0;
    if (stats[status] !== undefined) stats[status] = count;
  });

  return stats;
};

module.exports = { create, getAll, update, delete: deleteComplaint, getStatusStats };