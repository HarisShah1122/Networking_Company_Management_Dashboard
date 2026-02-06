const activityLogService = require('./activityLog.service');
const SLAService = require('./sla.service');
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
    if (data.assignedTo) { 
      sqlFields.push('assigned_to'); placeholders.push('?'); values.push(data.assignedTo);
      // If assigned, start SLA timer
      const slaDeadline = new Date(now.getTime() + (24 * 60 * 60 * 1000));
      sqlFields.push('assigned_at', 'sla_deadline', 'sla_status'); 
      placeholders.push('?', '?', '?'); 
      values.push(now, slaDeadline, 'pending');
    }

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

const getAll = async (companyId, areaId = null) => {
  try {
    let whereClause = '';
    if (companyId) {
      whereClause = `WHERE company_id = '${companyId}'`;
      if (areaId) {
        whereClause += ` AND area = '${areaId}'`;
      }
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
    console.log('🔧 Update called with:', { id, data, userId, companyId });
    
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
    
    // Handle assignment changes
    if (data.assignedTo !== undefined) {
      const oldAssignedTo = complaintData.assigned_to;
      const newAssignedTo = data.assignedTo ?? complaintData.assigned_to;
      
      updateData.assignedTo = newAssignedTo;
      
      // If assignment changed and new assignment exists
      if (oldAssignedTo !== newAssignedTo && newAssignedTo) {
        const now = new Date();
        const slaDeadline = new Date(now.getTime() + (24 * 60 * 60 * 1000));
        
        updateData.assigned_at = now;
        updateData.sla_deadline = slaDeadline;
        updateData.sla_status = 'pending';
        
        console.log(` SLA timer started for complaint ${id} assigned to technician ${newAssignedTo}`);
      }
    }

    // If status is being changed to closed, check SLA
    if (data.status === 'closed' && complaintData.status !== 'closed') {
      await SLAService.checkSLAStatus(id);
    }

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

const getStatusStats = async (companyId, areaId = null) => {
  let whereClause = companyId ? { company_id: companyId } : {};
  if (areaId) {
    whereClause.area = areaId;
  }
  
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

const assignToTechnician = async (complaintId, technicianId, userId, companyId) => {
  try {
    const complaint = await Complaint.findOne({ 
      where: { id: complaintId, company_id: companyId } 
    });
    
    if (!complaint) {
      throw new Error('Complaint not found');
    }

    // Start SLA timer and update complaint in one step
    const slaData = await SLAService.startSLATimer(complaintId, technicianId);
    
    // Get technician details for email notification
    const { User } = require('../models');
    const technician = await User.findByPk(technicianId, {
      attributes: ['id', 'email', 'username', 'name']
    });

    // Get user who assigned the complaint
    const assigningUser = await User.findByPk(userId, {
      attributes: ['id', 'username', 'name']
    });

    // Send email notification to technician
    if (technician && technician.email && assigningUser) {
      const emailService = require('./email.service');
      const complaintData = complaint.toJSON();
      
      try {
        await emailService.sendComplaintAssignmentNotification(
          technician.email,
          technician.username || technician.name,
          complaintData,
          assigningUser.username || assigningUser.name
        );
        console.log(`📧 Assignment notification sent to ${technician.email}`);
      } catch (emailError) {
        console.warn('⚠️ Failed to send assignment email notification:', emailError.message);
      }
    }
    
    // The SLA service already updates the complaint, so we just need to log the activity
    activityLogService.logActivity(
      userId, 
      'assign_complaint', 
      'complaint', 
      `Complaint #${complaintId} assigned to technician ${technicianId}`
    );

    // Return the updated complaint data
    const updatedComplaint = await Complaint.findByPk(complaintId);
    return {
      ...updatedComplaint.toJSON(),
      ...slaData
    };
  } catch (error) {
    console.error('Error assigning complaint:', error);
    throw error;
  }
};

const getSLAStats = async (companyId, areaId = null) => {
  try {
    return await SLAService.getSLAStats(companyId, areaId);
  } catch (error) {
    console.error('Error getting SLA stats:', error);
    throw error;
  }
};

module.exports = { 
  create, 
  getAll, 
  update, 
  delete: deleteComplaint, 
  getStatusStats,
  assignToTechnician,
  getSLAStats
};