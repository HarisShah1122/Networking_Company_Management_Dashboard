const { validationResult } = require('express-validator');
const ApiResponse = require('../helpers/responses');
const ComplaintService = require('../services/complaint.service');
const { sendWhatsAppMessage } = require('../helpers/whatsappHelper');

// Create complaint
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
      description: req.body.description?.trim() || null,
    };

    const complaint = await ComplaintService.create(cleanData, req.user?.id || null);

    // ---------------- Send WhatsApp to Customer ----------------
    if (complaint.whatsapp_number) {
      const customerMessage = `✅ Your complaint has been registered successfully!
Complaint ID: ${complaint.id}
Title: ${complaint.title}
Description: ${complaint.description}
Status: ${complaint.status}`;
      await sendWhatsAppMessage(complaint.whatsapp_number, customerMessage);
    }

    // ---------------- Send WhatsApp to Admin ----------------
    const adminNumber = process.env.ADMIN_WHATSAPP_NUMBER || '+923429055515';
    const adminMessage = `📢 New Complaint Received!
Customer: ${complaint.name || 'N/A'}
Issue: ${complaint.description || 'No description'}
ID: ${complaint.id}`;
    await sendWhatsAppMessage(adminNumber, adminMessage);

    return ApiResponse.success(res, complaint, 'Complaint registered successfully', 201);
  } catch (err) {
    next(err);
  }
};

// Get all complaints
const getAllComplaints = async (req, res, next) => {
  try {
    const complaints = await ComplaintService.getAll(req.companyId);
    return ApiResponse.success(res, { complaints });
  } catch (err) {
    next(err);
  }
};

// Update complaint
const updateComplaint = async (req, res, next) => {
  try {
    const { id } = req.params;
    const complaint = await ComplaintService.update(id, req.body, req.user?.id || null);
    return ApiResponse.success(res, complaint, 'Complaint updated');
  } catch (err) {
    next(err);
  }
};

// Get complaint statistics
const getStats = async ( req, res, next) => {
  try {
    const stats = await ComplaintService.getStatusStats();
    return ApiResponse.success(res, { stats }, 'Complaint status statistics retrieved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { createComplaint, getAllComplaints, updateComplaint, getStats };