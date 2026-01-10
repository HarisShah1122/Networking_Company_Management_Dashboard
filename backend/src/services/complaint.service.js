const activityLogService = require('./activityLog.service');
const models = require('../models');
const { Complaint, Customer } = models;
const { fetchCustomerData } = require('../helpers/customerHelper');

if (!Complaint) {
  throw new Error('Complaint model is not defined. Check models/index.js');
}

const create = async (data, userId) => {
  try {
    const complaintData = {
      customerId: data.customerId || null,
      connectionId: data.connectionId || null,
      title: data.title || '',
      description: data.description || '',
      status: data.status || 'open',
      priority: data.priority || 'medium',
      assignedTo: data.assignedTo || null
    };
    
    const complaint = await Complaint.create(complaintData);
    activityLogService.logActivity(userId, 'create_complaint', 'complaint', `Complaint #${complaint.id}`);
    
    const complaintJson = complaint.toJSON ? complaint.toJSON() : complaint;
    const customerData = await fetchCustomerData(complaintJson.customerId);
    
    return {
      ...complaintJson,
      name: customerData.name,
      whatsapp_number: customerData.phone
    };
  } catch (error) {
    throw error;
  }
};

const getAll = async () => {
  try {
    const complaints = await Complaint.findAll({
      attributes: ['id', 'customerId', 'connectionId', 'title', 'description', 'status', 'priority', 'assignedTo', 'createdAt', 'updatedAt'],
      order: [['created_at', 'DESC']],
      raw: false
    });
    
    const complaintsWithNames = await Promise.all(complaints.map(async (complaint) => {
      const complaintData = complaint.toJSON ? complaint.toJSON() : complaint;
      const customerData = await fetchCustomerData(complaintData.customerId);
      
      return {
        ...complaintData,
        name: customerData.name,
        whatsapp_number: customerData.phone
      };
    }));
    
    return complaintsWithNames;
  } catch (error) {
    if (error.message && (error.message.includes('Unknown column') || error.message.includes('doesn\'t exist') || error.message.includes('ER_BAD_FIELD_ERROR'))) {
      try {
        const complaints = await Complaint.findAll({
          attributes: ['id', 'customerId', 'connectionId', 'title', 'description', 'status', 'priority', 'assignedTo', 'createdAt', 'updatedAt'],
          order: [['created_at', 'DESC']],
          raw: false
        });
        
        const complaintsWithNames = await Promise.all(complaints.map(async (complaint) => {
          const complaintData = complaint.toJSON ? complaint.toJSON() : complaint;
          const customerData = await fetchCustomerData(complaintData.customerId);
          
          return {
            ...complaintData,
            name: customerData.name,
            whatsapp_number: customerData.phone
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
    
    const updateData = {
      customerId: data.customerId ?? complaint.customerId,
      connectionId: data.connectionId ?? complaint.connectionId,
      title: data.title ?? complaint.title,
      description: data.description ?? complaint.description,
      status: data.status ?? complaint.status,
      priority: data.priority ?? complaint.priority,
      assignedTo: data.assignedTo ?? complaint.assignedTo
    };
    
    await complaint.update(updateData);
    activityLogService.logActivity(userId, 'update_complaint', 'complaint', `Updated complaint #${id}`);
    
    const complaintJson = complaint.toJSON ? complaint.toJSON() : complaint;
    const customerId = updateData.customerId ?? complaintJson.customerId;
    const customerData = await fetchCustomerData(customerId);
    
    return {
      ...complaintJson,
      name: customerData.name,
      whatsapp_number: customerData.phone
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