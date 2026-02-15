const activityLogService = require('./activityLog.service');
const SLAService = require('./sla.service');
const models = require('../models');
const { Complaint, sequelize, Customer, Area, User } = models;
const { fetchCustomerData } = require('../helpers/customerHelper');
const { randomUUID } = require('crypto');

if (!Complaint) throw new Error('Complaint model is not defined. Check models/index.js');

const create = async (data, userId, companyId) => {
  try {
    // Check for duplicate complaint
    if (data.customerId && data.title) {
      const duplicateCheck = await sequelize.query(`
        SELECT id, title, status, created_at 
        FROM complaints 
        WHERE customer_id = ? 
        AND title = ? 
        AND company_id = ? 
        AND status NOT IN ('closed', 'resolved')
        AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
      `, {
        replacements: [data.customerId, data.title, companyId],
        type: sequelize.QueryTypes.SELECT
      });

      if (duplicateCheck.length > 0) {
        const existingComplaint = duplicateCheck[0];
        const timeDiff = new Date() - new Date(existingComplaint.created_at);
        const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
        
        throw new Error(`Duplicate complaint detected! A similar complaint "${existingComplaint.title}" was already registered ${hoursAgo} hours ago (ID: ${existingComplaint.id}). Please check existing complaint before creating a new one.`);
      }
    }

    let name = data.name ?? null;
    let whatsapp_number = data.whatsapp_number ?? null;
    let address = data.address ?? null;
    let area = data.area ?? null;

    if ((!name || !whatsapp_number || !address || !area) && data.customerId) {
      const customerData = await fetchCustomerData(data.customerId);
      name = name ?? customerData.name ?? null;
      whatsapp_number = whatsapp_number ?? customerData.phone ?? customerData.whatsapp_number ?? null;
      address = address ?? customerData.address ?? null;
      area = area ?? customerData.area ?? null;
    }

    const complaintId = randomUUID();
    const now = new Date();

    let sqlFields = ['id','title','description','status','priority','name','whatsapp_number','address','area','company_id','created_at','updated_at'];
    let placeholders = ['?','?','?','?','?','?','?','?','?','?','?','?'];
    let values = [complaintId, data.title ?? '', data.description ?? '', data.status ?? 'open', data.priority ?? 'medium', name, whatsapp_number, address, area, companyId, now, now];

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

    // Get the created complaint with proper associations
    const complaint = await Complaint.findByPk(complaintId, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'email', 'phone', 'area_id']
        },
        {
          model: Area,
          as: 'companyArea',
          attributes: ['id', 'name', 'manager_id'],
          include: [{
            model: User,
            as: 'manager',
            attributes: ['id', 'name', 'email', 'phone', 'username']
          }]
        }
      ]
    });

    activityLogService.logActivity(userId, 'create_complaint', 'complaint', `Complaint #${complaintId}`);

    return {
      ...complaint.toJSON(),
      name,
      whatsapp_number,
      address
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
      const customerData = await fetchCustomerData(data.customer_id);
      return { 
        ...data, 
        name: data.name ?? customerData.name ?? null, 
        whatsapp_number: data.whatsapp_number ?? customerData.phone ?? customerData.whatsapp_number ?? null,
        address: data.address ?? customerData.address ?? null,
        father_name: customerData.father_name,
        pace_user_id: customerData.pace_user_id,
        customer_email: customerData.email
      };
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
    let address = data.address ?? complaintData.address ?? null;
    let father_name = null;

    if ((!name || !whatsapp_number || !address) && customerId) {
      const customerData = await fetchCustomerData(customerId);
      name = name ?? customerData.name ?? null;
      whatsapp_number = whatsapp_number ?? customerData.phone ?? customerData.whatsapp_number ?? null;
      address = address ?? customerData.address ?? null;
      father_name = customerData.father_name;
    }

    const updateData = {
      title: data.title ?? complaintData.title,
      description: data.description ?? complaintData.description,
      status: data.status ?? complaintData.status,
      priority: data.priority ?? complaintData.priority,
      name,
      whatsapp_number,
      address
    };

    if (customerId) updateData.customerId = customerId;
    if (data.connectionId !== undefined) updateData.connectionId = data.connectionId ?? complaintData.connectionId;
    
    // Handle assignment changes
    if (data.assignedTo !== undefined) {
      const oldAssignedTo = complaintData.assigned_to;
      const newAssignedTo = data.assignedTo ?? complaintData.assigned_to;
      
      updateData.assigned_to = newAssignedTo;
      
      // If assignment changed and new assignment exists
      if (oldAssignedTo !== newAssignedTo && newAssignedTo) {
        const now = new Date();
        const slaDeadline = new Date(now.getTime() + (24 * 60 * 60 * 1000));
        
        updateData.assigned_at = now;
        updateData.sla_deadline = slaDeadline;
        updateData.sla_status = 'pending';
      }
    }

    // If status is being changed to closed, check SLA
    if (data.status === 'closed' && complaintData.status !== 'closed') {
      await SLAService.checkSLAStatus(id);
    }

    await complaint.update(updateData);
    activityLogService.logActivity(userId, 'update_complaint', 'complaint', `Updated complaint #${id}`);

    // Send email notification for status change
    if (data.status && data.status !== complaintData.status) {
      try {
        const emailService = require('./email.service');
        const updatedComplaint = await Complaint.findByPk(id);
        
        // Get customer email if customerId exists
        let customerEmail = null;
        let customer = null;
        
        if (updatedComplaint.customerId) {
          const { Customer } = require('../models');
          customer = await Customer.findByPk(updatedComplaint.customerId, {
            attributes: ['email', 'pace_user_id', 'phone', 'name', 'father_name']
          });
          customerEmail = customer?.email;
        }
        
        // Only send email if we have a valid customer email
        if (customerEmail && customerEmail !== 'customer@example.com' && customerEmail.trim() !== '') {
          console.log('📧 Sending complaint status update email to:', customerEmail);
          
          // Add customer details to complaint data for email
          const complaintWithCustomer = {
            ...updatedComplaint.toJSON(),
            customer: customer ? {
              pace_user_id: customer.pace_user_id,
              phone: customer.phone,
              email: customer.email,
              name: customer.name,
              father_name: customer.father_name
            } : null
          };
          
          const emailResult = await emailService.sendComplaintStatusUpdateNotification(
            customerEmail,
            updatedComplaint.name || customer?.name || 'Customer',
            complaintWithCustomer,
            complaintData.status,
            data.status
          );
          
          if (emailResult.success) {
            console.log('✅ Complaint status update email sent successfully to:', customerEmail);
          } else {
            console.warn('⚠️ Failed to send status update email:', emailResult.error);
          }
        } else {
          console.log('⚠️ Cannot send complaint status update email - no valid customer email found');
          console.log('   Customer ID:', updatedComplaint.customerId);
          console.log('   Customer Email:', customerEmail || 'Not found');
          console.log('   Customer Name:', customer?.name || 'Not found');
        }
      } catch (emailError) {
        console.warn('⚠️ Failed to send status update email:', emailError.message);
        console.error('Email error details:', emailError.stack);
      }
    }

    return { ...complaint.toJSON(), name, whatsapp_number, address };
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
      attributes: ['id', 'email', 'username', 'phone']
    });

    // Get user who assigned the complaint
    const assigningUser = await User.findByPk(userId, {
      attributes: ['id', 'username', 'phone']
    });

    // Send email notification to technician (non-blocking)
    if (technician && technician.email && assigningUser) {
      // Fire and forget - don't wait for email to complete
      setImmediate(async () => {
        try {
          const emailService = require('./email.service');
          const complaintData = complaint.toJSON();
          
          await emailService.sendComplaintAssignmentNotification(
            technician.email,
            technician.username,
            complaintData,
            assigningUser.username
          );
          console.log('📧 Assignment email sent successfully');
        } catch (emailError) {
          console.warn('⚠️ Failed to send assignment email notification:', emailError.message);
        }
      });
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