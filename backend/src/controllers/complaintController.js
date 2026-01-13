const { validationResult } = require('express-validator');
const ApiResponse = require('../helpers/responses');

// Load service with error handling
let ComplaintService;
try {
  ComplaintService = require('../services/complaint.service');
} catch (error) {
  throw error;
}

const createComplaint = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => err.msg || err.message);
      return ApiResponse.validationError(res, errorMessages);
    }
    
    // Clean up the data - convert empty strings to null
    const cleanData = {
      ...req.body,
      customerId: req.body.customerId && req.body.customerId.trim() ? req.body.customerId.trim() : null,
      connectionId: req.body.connectionId && req.body.connectionId.trim() ? req.body.connectionId.trim() : null,
      name: req.body.name && req.body.name.trim() ? req.body.name.trim() : null,
      address: req.body.address && req.body.address.trim() ? req.body.address.trim() : null,
      whatsapp_number: req.body.whatsapp_number && req.body.whatsapp_number.trim() ? req.body.whatsapp_number.trim() : null,
    };
    
    const complaint = await ComplaintService.create(cleanData, req.user.id);
    return ApiResponse.success(res, complaint, 'Complaint registered successfully', 201);
  } catch (error) {
    next(error);
  }
};

const getAllComplaints = async (req, res, next) => {
  try {
    const complaints = await ComplaintService.getAll();
    return ApiResponse.success(res, { complaints });
  } catch (error) {
    next(error);
  }
};

const updateComplaint = async (req, res, next) => {
  try {
    const { id } = req.params;
    const complaint = await ComplaintService.update(id, req.body, req.user.id);
    return ApiResponse.success(res, complaint, 'Complaint updated');
  } catch (error) {
    next(error);
  }
};


module.exports = {
  createComplaint,
  getAllComplaints,
  updateComplaint
};