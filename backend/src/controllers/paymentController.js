const multer = require('multer');
const path = require('path');
const ApiResponse = require('../helpers/responses');
const { Payment } = require('../models');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/receipts/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) return cb(new Error('Only images are allowed'));
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
      if (!trxId || !customerId || !amount || !receivedBy) return ApiResponse.error(res, 'trxId, customerId, amount and receivedBy are required', 400);

      const existing = await Payment.findOne({ where: { trxId } });
      if (existing) return ApiResponse.error(res, 'Duplicate TRX ID', 400);

      const payment = await Payment.create({
        trxId,
        customerId,
        amount,
        receivedBy,
        status: status || 'pending',
        paymentMethod: paymentMethod || 'cash',
        receiptImage
      });

      return ApiResponse.success(res, payment, 'Payment recorded', 201);
    } catch (error) {
      console.error(error);
      return ApiResponse.error(res, error.message, 500);
    }
  });
};

const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.findAll();
    return ApiResponse.success(res, { payments }, 'Payments fetched');
  } catch (error) {
    console.error(error);
    return ApiResponse.error(res, error.message, 500);
  }
};

const getPaymentsByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const payments = await Payment.findAll({ where: { customerId } });
    return ApiResponse.success(res, { payments }, 'Customer payments');
  } catch (error) {
    console.error(error);
    return ApiResponse.error(res, error.message, 500);
  }
};

module.exports = { createPayment, getAllPayments, getPaymentsByCustomer };
