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
    const complaint = await ComplaintService.create(req.body, req.user.id);
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