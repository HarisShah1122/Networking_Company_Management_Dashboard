const ApiResponse = require('../helpers/responses');

const createPayment = async (req, res) => {
  return ApiResponse.success(res, { message: 'Payment endpoint working' }, 'Payment recorded', 201);
};

const getAllPayments = async (req, res) => {
  return ApiResponse.success(res, { payments: [] }, 'Payments fetched');
};

const getPaymentsByCustomer = async (req, res) => {
  return ApiResponse.success(res, { payments: [] }, 'Customer payments');
};

module.exports = { createPayment, getAllPayments, getPaymentsByCustomer };