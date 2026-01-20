// controllers/paymentController.js
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const ApiResponse = require('../helpers/responses');
const { Payment, Customer } = require('../models');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/receipts/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) return cb(new Error('Only images allowed'));
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 }
}).single('receiptImage');

const createPayment = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) return ApiResponse.error(res, err.message, 400);

    const { trxId, customerId, amount, status, receivedBy, paymentMethod } = req.body;
    const receiptImage = req.file ? `/uploads/receipts/${req.file.filename}` : null;

    try {
      if (!trxId || !customerId || !amount || !receivedBy) {
        return ApiResponse.error(res, 'trxId, customerId, amount, receivedBy required', 400);
      }

      const customer = await Customer.findByPk(customerId);
      if (!customer) return ApiResponse.error(res, `Customer ${customerId} not found`, 404);

      const existing = await Payment.findOne({ where: { trx_id: trxId } });
      if (existing) return ApiResponse.error(res, 'Duplicate TRX ID', 409);

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

      // Return with customer data
      const fullPayment = await Payment.findByPk(payment.id, {
        include: [{ model: Customer, as: 'customer', attributes: ['id', 'name'] }]
      });

      return ApiResponse.success(res, fullPayment, 'Payment recorded', 201);
    } catch (error) {
      console.error('Create payment error:', error);
      return ApiResponse.error(res, error.message || 'Server error', 500);
    }
  });
};

const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.findAll({
      include: [{
        model: Customer,
        as: 'customer',                    // ← MUST match the alias in .associate
        attributes: ['id', 'name', 'whatsapp_number']
      }],
      order: [['created_at', 'DESC']]
    });

    return ApiResponse.success(res, { payments }, 'Payments fetched');
  } catch (error) {
    console.error('Get all payments error:', error);
    return ApiResponse.error(res, error.message || 'Failed to fetch payments', 500);
  }
};

const getPaymentsByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    if (!customerId) return ApiResponse.error(res, 'customerId required', 400);

    const payments = await Payment.findAll({
      where: { customer_id: customerId },
      include: [{
        model: Customer,
        as: 'customer',
        attributes: ['name']
      }],
      order: [['created_at', 'DESC']]
    });

    return ApiResponse.success(res, { payments }, 'Customer payments fetched');
  } catch (error) {
    console.error('Get by customer error:', error);
    return ApiResponse.error(res, error.message || 'Failed to fetch', 500);
  }
};

module.exports = { createPayment, getAllPayments, getPaymentsByCustomer };