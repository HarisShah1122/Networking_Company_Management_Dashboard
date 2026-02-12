const { validationResult } = require('express-validator');
const ApiResponse = require('../helpers/responses');
const ComplaintService = require('../services/complaint.service');
const { sendComplaintNotification, sendWhatsAppMessage } = require('../helpers/whatsappHelper');

const createComplaint = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ApiResponse.validationError(res, errors.array().map(e => e.msg));
    }

    const cleanData = {
      ...req.body,
      customerId: req.body.customerId?.trim() || null,
      connectionId: req.body.connectionId?.trim() || null,
      name: req.body.name?.trim() || null,
      address: req.body.address?.trim() || null,
      whatsapp_number: req.body.whatsapp_number?.trim() || null,
    };

    const complaint = await ComplaintService.create(cleanData, req.user?.id || null, req.companyId);

    if (complaint.whatsapp_number) {
      const recipientNumber = complaint.whatsapp_number;
      
      try {
        const axios = require('axios');
        const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
        const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
        const WHATSAPP_API_URL = `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`;
        
        const templatePayload = {
          messaging_product: 'whatsapp',
          to: recipientNumber.replace('+', ''),
          type: 'template',
          template: {
            name: 'hello_world',
            language: {
              code: 'en_US'
            }
          }
        };

        const templateResponse = await axios.post(WHATSAPP_API_URL, templatePayload, {
          headers: {
            'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          }
        });
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const customerMessage = `🎫 PACE Telecom

Dear ${complaint.name || 'Customer'},

Your complaint has been registered!

ID: ${complaint.id}
Title: ${complaint.title}
Status: ${complaint.status}

We'll resolve this soon. Thank you!

📞 0342-4231806
🌐 pacetelecom.com`;
        
        const payload = {
          messaging_product: 'whatsapp',
          to: recipientNumber.replace('+', ''),
          type: 'text',
          text: {
            body: customerMessage
          }
        };

        const response = await axios.post(WHATSAPP_API_URL, payload, {
          headers: {
            'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          }
        });
        
      } catch (error) {
        // WhatsApp notification failed
      }
    } else {
      // No WhatsApp number provided for customer
    }

    await sendComplaintNotification(complaint.name || 'N/A', complaint.id, complaint.description || 'No description');

    // Send email confirmation to customer
    try {
      const emailService = require('../services/email.service');
      
      // Get customer email if customerId exists
      let customerEmail = 'customer@example.com';
      if (complaint.customerId) {
        const { Customer } = require('../models');
        const customer = await Customer.findByPk(complaint.customerId, {
          attributes: ['email', 'pace_user_id', 'phone', 'name', 'father_name', 'address']
        });
        customerEmail = customer?.email || 'customer@example.com';
        
        if (customer?.email) {
          const complaintWithCustomer = {
            ...complaint,
            customer: {
              pace_user_id: customer.pace_user_id,
              phone: customer.phone,
              email: customer.email,
              name: customer.name,
              father_name: customer.father_name,
              address: customer.address
            }
          };
          
          await emailService.sendComplaintCreationNotification(
            customer.email,
            customer.name || complaint.name || 'Customer',
            complaintWithCustomer
          );
          console.log('📧 Complaint confirmation email sent to:', customer.email);
        }
      }
    } catch (emailError) {
      console.warn('⚠️ Failed to send complaint confirmation email:', emailError.message);
    }

    return ApiResponse.success(res, complaint, 'Complaint registered successfully', 201);
  } catch (err) {
    next(err);
  }
};

const getAllComplaints = async (req, res, next) => {
  try {
    const complaints = await ComplaintService.getAll(req.companyId);
    return ApiResponse.success(res, { complaints });
  } catch (err) {
    next(err);
  }
};

const updateComplaint = async (req, res, next) => {
  try {
    const { id } = req.params;
    const complaint = await ComplaintService.update(id, req.body, req.user?.id || null, req.companyId);
    return ApiResponse.success(res, complaint, 'Complaint updated');
  } catch (err) {
    next(err);
  }
};

const getStats = async ( req, res, next) => {
  try {
    const stats = await ComplaintService.getStatusStats(req.companyId);
    return ApiResponse.success(res, { stats }, 'Complaint status statistics retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const assignToTechnician = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { technicianId } = req.body;
    
    if (!technicianId) {
      return ApiResponse.badRequest(res, 'Technician ID is required');
    }
    
    const complaint = await ComplaintService.assignToTechnician(id, technicianId, req.user?.id || null, req.companyId);
    return ApiResponse.success(res, complaint, 'Complaint assigned successfully');
  } catch (err) {
    next(err);
  }
};

const getSLAStats = async (req, res, next) => {
  try {
    const { areaId } = req.query;
    const stats = await ComplaintService.getSLAStats(req.companyId, areaId);
    return ApiResponse.success(res, stats, 'SLA statistics retrieved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createComplaint,
  getAllComplaints,
  updateComplaint,
  getStats,
  assignToTechnician,
  getSLAStats
};