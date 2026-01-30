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

    const complaint = await ComplaintService.create(cleanData, req.user?.id || null);

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
      }
    } else {
    }

    await sendComplaintNotification(complaint.name || 'N/A', complaint.id, complaint.description || 'No description');

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
    const complaint = await ComplaintService.update(id, req.body, req.user?.id || null);
    return ApiResponse.success(res, complaint, 'Complaint updated');
  } catch (err) {
    next(err);
  }
};

const getStats = async ( req, res, next) => {
  try {
    const stats = await ComplaintService.getStatusStats();
    return ApiResponse.success(res, { stats }, 'Complaint status statistics retrieved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { createComplaint, getAllComplaints, updateComplaint, getStats };