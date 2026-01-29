const ApiResponse = require('../helpers/responses');
const externalComplaintService = require('../services/externalComplaint.service');

// Get all complaints (internal + external)
const getAllComplaints = async (req, res, next) => {
  try {
    const { branch, district, source } = req.query;
    const companyId = req.user?.companyId || req.companyId;

    let complaints;
    
    if (branch && branch !== 'all') {
      // Get complaints for specific branch
      complaints = await externalComplaintService.getComplaintsByBranch(branch, companyId);
    } else {
      // Get all complaints
      complaints = await externalComplaintService.getAllComplaints(companyId);
    }

    // Apply additional filters
    if (district && district !== 'all') {
      complaints = complaints.filter(c => c.district === district);
    }

    if (source && source !== 'all') {
      complaints = complaints.filter(c => c.source === source);
    }

    return ApiResponse.success(res, { data: complaints }, 'Complaints retrieved successfully');
  } catch (err) {
    next(err);
  }
};

// Sync external complaints
const syncExternalComplaints = async (req, res, next) => {
  try {
    const result = await externalComplaintService.syncExternalComplaints();
    return ApiResponse.success(res, result, 'External complaints synced successfully');
  } catch (err) {
    next(err);
  }
};

// Create external complaint
const createExternalComplaint = async (req, res, next) => {
  try {
    const complaintData = {
      ...req.body,
      company_id: req.user?.companyId || req.companyId
    };

    const complaint = await externalComplaintService.createExternalComplaint(complaintData);
    return ApiResponse.success(res, complaint, 'External complaint created successfully', 201);
  } catch (err) {
    next(err);
  }
};

// Get complaints statistics
const getComplaintStats = async (req, res, next) => {
  try {
    const { branch, district } = req.query;
    const companyId = req.user?.companyId || req.companyId;

    let complaints;
    
    if (branch && branch !== 'all') {
      complaints = await externalComplaintService.getComplaintsByBranch(branch, companyId);
    } else {
      complaints = await externalComplaintService.getAllComplaints(companyId);
    }

    if (district && district !== 'all') {
      complaints = complaints.filter(c => c.district === district);
    }

    const stats = {
      total: complaints.length,
      internal: complaints.filter(c => c.source === 'internal').length,
      external: complaints.filter(c => c.source === 'external').length,
      open: complaints.filter(c => c.status === 'open').length,
      in_progress: complaints.filter(c => c.status === 'in_progress').length,
      on_hold: complaints.filter(c => c.status === 'on_hold').length,
      closed: complaints.filter(c => c.status === 'closed').length,
      by_source: {},
      by_district: {},
      by_priority: {
        urgent: complaints.filter(c => c.priority === 'urgent').length,
        high: complaints.filter(c => c.priority === 'high').length,
        medium: complaints.filter(c => c.priority === 'medium').length,
        low: complaints.filter(c => c.priority === 'low').length
      }
    };

    // Group by source
    complaints.forEach(complaint => {
      const source = complaint.sourceLabel || 'Unknown';
      stats.by_source[source] = (stats.by_source[source] || 0) + 1;
    });

    // Group by district
    complaints.forEach(complaint => {
      const district = complaint.district || 'Unknown';
      stats.by_district[district] = (stats.by_district[district] || 0) + 1;
    });

    return ApiResponse.success(res, { stats }, 'Complaint statistics retrieved successfully');
  } catch (err) {
    next(err);
  }
};

// Get branch configuration
const getBranchConfig = async (req, res, next) => {
  try {
    const branches = [
      {
        id: 'all',
        name: 'All Branches',
        district: 'all',
        areas: []
      },
      {
        id: 'mardan',
        name: 'Mardan Branch',
        district: 'Mardan',
        areas: ['Main Market', 'City Center', 'University Road', 'Kotla Mohsin Khan']
      },
      {
        id: 'katlang',
        name: 'Katlang Branch',
        district: 'Mardan',
        areas: ['Katlang Bazaar', 'Shahbaz Garhi', 'Takht Bhai']
      },
      {
        id: 'peshawar',
        name: 'Peshawar Branch',
        district: 'Peshawar',
        areas: ['University Town', 'Hayatabad', 'Cantt', 'Karkhano Market']
      },
      {
        id: 'islamabad',
        name: 'Islamabad Branch',
        district: 'Islamabad',
        areas: ['Blue Area', 'F-10 Markaz', 'G-11 Markaz', 'I-8 Markaz']
      },
      {
        id: 'rawalpindi',
        name: 'Rawalpindi Branch',
        district: 'Rawalpindi',
        areas: ['Saddar', 'Raja Bazaar', 'Commercial Market', 'Lalkurti']
      }
    ];

    return ApiResponse.success(res, { branches }, 'Branch configuration retrieved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllComplaints,
  syncExternalComplaints,
  createExternalComplaint,
  getComplaintStats,
  getBranchConfig
};
