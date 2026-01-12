const activityLogService = require('./activityLog.service');
const models = require('../models');
const { Complaint, Customer, sequelize } = models;
const { fetchCustomerData } = require('../helpers/customerHelper');
const { randomUUID } = require('crypto');

if (!Complaint) {
  throw new Error('Complaint model is not defined. Check models/index.js');
}

const create = async (data, userId) => {
  try {
    let name = data.name ?? null;
    let whatsapp_number = data.whatsapp_number ?? null;
    
    // If name or whatsapp_number not provided, fetch from customer
    if ((!name || !whatsapp_number) && data.customerId) {
      const customerData = await fetchCustomerData(data.customerId);
      name = name ?? customerData.name ?? null;
      whatsapp_number = whatsapp_number ?? customerData.phone ?? customerData.whatsapp_number ?? null;
    }
    
    const complaintId = randomUUID();
    const now = new Date();
    
    let sql = `INSERT INTO complaints (id, title, description, status, priority, name, whatsapp_number, created_at, updated_at`;
    let values = [complaintId, data.title ?? '', data.description ?? '', data.status ?? 'open', data.priority ?? 'medium', name, whatsapp_number, now, now];
    let placeholders = ['?', '?', '?', '?', '?', '?', '?', '?', '?'];
    
    if (data.customerId) {
      sql += `, customer_id`;
      values.push(data.customerId);
      placeholders.push('?');
    }
    if (data.connectionId) {
      sql += `, connection_id`;
      values.push(data.connectionId);
      placeholders.push('?');
    }
    if (data.assignedTo) {
      sql += `, assigned_to`;
      values.push(data.assignedTo);
      placeholders.push('?');
    }
    
    sql += `) VALUES (${placeholders.join(', ')})`;
    
    const transaction = await sequelize.transaction();
    try {
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { 
        transaction,
        type: sequelize.QueryTypes.RAW 
      });
      await sequelize.query(sql, {
        replacements: values,
        type: sequelize.QueryTypes.INSERT,
        transaction
      });
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { 
        transaction,
        type: sequelize.QueryTypes.RAW 
      });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
    
    const complaint = await Complaint.findByPk(complaintId, {
      attributes: ['id', 'customerId', 'connectionId', 'title', 'description', 'status', 'priority', 'assignedTo', 'name', 'whatsapp_number', 'createdAt', 'updatedAt']
    });
    activityLogService.logActivity(userId, 'create_complaint', 'complaint', `Complaint #${complaint.id}`);
    
    const complaintJson = complaint.toJSON ? complaint.toJSON() : complaint;
    
    // Ensure name and whatsapp_number are returned even if not in DB
    if (!complaintJson.name || !complaintJson.whatsapp_number) {
      const customerData = await fetchCustomerData(complaintJson.customerId);
      return {
        ...complaintJson,
        name: complaintJson.name ?? customerData.name ?? null,
        whatsapp_number: complaintJson.whatsapp_number ?? customerData.phone ?? customerData.whatsapp_number ?? null
      };
    }
    
    return complaintJson;
  } catch (error) {
    throw error;
  }
};

const getAll = async () => {
  try {
    const complaints = await Complaint.findAll({
      attributes: ['id', 'customerId', 'connectionId', 'title', 'description', 'status', 'priority', 'assignedTo', 'name', 'whatsapp_number', 'createdAt', 'updatedAt'],
      order: [['createdAt', 'DESC']],
      raw: false
    });
    
    const complaintsWithNames = await Promise.all(complaints.map(async (complaint) => {
      const complaintData = complaint.toJSON ? complaint.toJSON() : complaint;
      
      // Use stored name and whatsapp_number if available, otherwise fetch from customer
      let name = complaintData.name;
      let whatsapp_number = complaintData.whatsapp_number;
      
      if (!name || !whatsapp_number) {
        const customerData = await fetchCustomerData(complaintData.customerId);
        name = name ?? customerData.name ?? null;
        whatsapp_number = whatsapp_number ?? customerData.phone ?? customerData.whatsapp_number ?? null;
      }
      
      return {
        ...complaintData,
        name: name,
        whatsapp_number: whatsapp_number
      };
    }));
    
    return complaintsWithNames;
  } catch (error) {
    if (error.message && (error.message.includes('Unknown column') || error.message.includes('doesn\'t exist') || error.message.includes('ER_BAD_FIELD_ERROR'))) {
      try {
        // Fallback: try without name and whatsapp_number in attributes
        const complaints = await Complaint.findAll({
          attributes: ['id', 'customerId', 'connectionId', 'title', 'description', 'status', 'priority', 'assignedTo', 'createdAt', 'updatedAt'],
          order: [['createdAt', 'DESC']],
          raw: false
        });
        
        const complaintsWithNames = await Promise.all(complaints.map(async (complaint) => {
          const complaintData = complaint.toJSON ? complaint.toJSON() : complaint;
          const customerData = await fetchCustomerData(complaintData.customerId);
          
          return {
            ...complaintData,
            name: customerData.name ?? null,
            whatsapp_number: customerData.phone ?? customerData.whatsapp_number ?? null
          };
        }));
        
        return complaintsWithNames;
      } catch (fallbackError) {
        return [];
      }
    }
    throw error;
  }
};

const update = async (id, data, userId) => {
  try {
    const complaint = await Complaint.findByPk(id);
    if (!complaint) throw new Error('Complaint not found');
    
    const complaintJson = complaint.toJSON ? complaint.toJSON() : complaint;
    const customerId = data.customerId ?? complaintJson.customerId;
    
    let name = data.name ?? complaintJson.name ?? null;
    let whatsapp_number = data.whatsapp_number ?? complaintJson.whatsapp_number ?? null;
    
    // If name or whatsapp_number not available, fetch from customer
    if ((!name || !whatsapp_number) && customerId) {
      const customerData = await fetchCustomerData(customerId);
      name = name ?? customerData.name ?? null;
      whatsapp_number = whatsapp_number ?? customerData.phone ?? customerData.whatsapp_number ?? null;
    }
    
    const updateData = {
      title: data.title ?? complaintJson.title,
      description: data.description ?? complaintJson.description,
      status: data.status ?? complaintJson.status,
      priority: data.priority ?? complaintJson.priority,
      name: name,
      whatsapp_number: whatsapp_number
    };
    
    if (customerId !== undefined && customerId !== null) {
      updateData.customerId = customerId;
    }
    if (data.connectionId !== undefined) {
      updateData.connectionId = data.connectionId ?? complaintJson.connectionId;
    }
    if (data.assignedTo !== undefined) {
      updateData.assignedTo = data.assignedTo ?? complaintJson.assignedTo;
    }
    
    await complaint.update(updateData);
    activityLogService.logActivity(userId, 'update_complaint', 'complaint', `Updated complaint #${id}`);
    
    const updatedComplaint = complaint.toJSON ? complaint.toJSON() : complaint;
    
    return {
      ...updatedComplaint,
      name: updatedComplaint.name ?? name ?? null,
      whatsapp_number: updatedComplaint.whatsapp_number ?? whatsapp_number ?? null
    };
  } catch (error) {
    throw error;
  }
};

const deleteComplaint = async (id, userId) => {
  try {
    const complaint = await Complaint.findByPk(id);
    if (!complaint) throw new Error('Complaint not found');
    await complaint.destroy();
    activityLogService.logActivity(userId, 'delete_complaint', 'complaint', `Deleted complaint #${id}`);
    return true;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  create,
  getAll,
  update,
  delete: deleteComplaint
};