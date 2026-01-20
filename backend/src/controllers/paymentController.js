const { v4: uuidv4 } = require('uuid');
const ApiResponse = require('../helpers/responses');
const { Payment, Customer } = require('../models');

const createPayment = async (req, res) => {
  try {
    const { trxId, customerId, amount, status, receivedBy, paymentMethod } = req.body;

    if (!trxId || !customerId || !amount || !receivedBy) {
      return ApiResponse.error(res, 'trxId, customerId, amount, receivedBy required', 400);
    }

    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return ApiResponse.error(res, `Customer ${customerId} not found`, 404);
    }

    const exists = await Payment.findOne({ where: { trx_id: trxId } });
    if (exists) {
      return ApiResponse.error(res, 'Duplicate TRX ID', 409);
    }

    const receiptImage = req.file
      ? `/uploads/receipts/${req.file.filename}`
      : null;

    const payment = await Payment.create({
      id: uuidv4(),
      customer_id: customerId,
      amount: parseFloat(amount),
      payment_method: paymentMethod || 'cash',
      received_by: receivedBy,
      trx_id: trxId,
      receipt_image: receiptImage,
      status: status || 'pending'
    });

    const fullPayment = await Payment.findByPk(payment.id, {
      include: [{ model: Customer, as: 'customer', attributes: ['id', 'name'] }]
    });

    return ApiResponse.success(res, fullPayment, 'Payment recorded', 201);
  } catch (error) {
    console.error('Create payment error:', error);
    return ApiResponse.error(res, 'Server error', 500);
  }
};

const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.findAll({
      include: [{
        model: Customer,
        as: 'customer',
        attributes: ['id', 'name', 'whatsapp_number']
      }],
      order: [['created_at', 'DESC']]
    });

    return ApiResponse.success(res, { payments }, 'Payments fetched');
  } catch (error) {
    return ApiResponse.error(res, 'Failed to fetch payments', 500);
  }
};

const getPaymentsByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;

    const payments = await Payment.findAll({
      where: { customer_id: customerId },
      include: [{ model: Customer, as: 'customer', attributes: ['name'] }],
      order: [['created_at', 'DESC']]
    });

    return ApiResponse.success(res, { payments }, 'Customer payments fetched');
  } catch (error) {
    return ApiResponse.error(res, 'Failed to fetch', 500);
  }
};

module.exports = {
  createPayment,
  getAllPayments,
  getPaymentsByCustomer
};
