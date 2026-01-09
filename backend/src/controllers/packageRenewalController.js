const ApiResponse = require('../helpers/responses');

const createRenewal = async (req, res) => {
  return ApiResponse.success(res, { message: 'Renewal endpoint working' }, 'Package renewed', 201);
};

const getAllRenewals = async (req, res) => {
  return ApiResponse.success(res, { renewals: [] }, 'Renewals fetched');
};

const getByConnectionId = async (req, res) => {
  return ApiResponse.success(res, { renewals: [] }, 'Connection renewals');
};

module.exports = { createRenewal, getAllRenewals, getByConnectionId };