const { v4: uuidv4 } = require('uuid');
const ApiResponse = require('../helpers/responses');
const { Payment, Customer } = require('../models');
const { sendPaymentConfirmation } = require('../helpers/whatsappHelper');

const createPayment = async (req, res) => {
  try {
    const { trxId, customerId, amount, status, receivedBy, paymentMethod } = req.body;

    if (!trxId || !customerId || !amount || !receivedBy) {
      return ApiResponse.error(res, 'trxId, customerId, amount, receivedBy required', 400);
    }

    const customer = await Customer.findOne({ 
      where: { 
        id: customerId, 
        company_id: req.companyId 
      } 
    });
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
      company_id: req.companyId,
      amount: parseFloat(amount),
      payment_method: paymentMethod || 'cash',
      received_by: receivedBy,
      trx_id: trxId,
      receipt_image: receiptImage,
      status: status || 'pending'
    });

    const fullPayment = await Payment.findByPk(payment.id, {
      include: [{ model: Customer, as: 'customer', attributes: ['id', 'name', 'email'] }]
    });

    // Send WhatsApp notification for payment confirmation
    if (status === 'confirmed' || status === 'approved') {
      await sendPaymentConfirmation(customer.name, parseFloat(amount), payment.id);
    }

    // Send email notification for payment confirmation
    if ((status === 'confirmed' || status === 'approved') && customer.email) {
      try {
        const emailService = require('../services/email.service');
        await emailService.sendPaymentConfirmationNotification(
          customer.email,
          fullPayment.toJSON()
        );
        console.log(`📧 Payment confirmation email sent to ${customer.email}`);
      } catch (emailError) {
        console.warn('⚠️ Failed to send payment confirmation email:', emailError.message);
      }
    }

    return ApiResponse.success(res, fullPayment, 'Payment recorded', 201);
  } catch (error) {
    console.error('Create payment error:', error);
    return ApiResponse.error(res, 'Server error', 500);
  }
};

const updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { trxId, customerId, amount, status, receivedBy, paymentMethod } = req.body;

    const payment = await Payment.findOne({ 
      where: { 
        id, 
        company_id: req.companyId 
      } 
    });
    if (!payment) {
      return ApiResponse.error(res, 'Payment not found', 404);
    }

    if (customerId) {
      const customer = await Customer.findOne({ 
        where: { 
          id: customerId, 
          company_id: req.companyId 
        } 
      });
      if (!customer) {
        return ApiResponse.error(res, `Customer ${customerId} not found`, 404);
      }
      payment.customer_id = customerId;
    }

    if (trxId && trxId !== payment.trx_id) {
      const exists = await Payment.findOne({ where: { trx_id: trxId } });
      if (exists) {
        return ApiResponse.error(res, 'Duplicate TRX ID', 409);
      }
      payment.trx_id = trxId;
    }

    if (amount) {
      payment.amount = parseFloat(amount);
    }

    if (paymentMethod) {
      payment.payment_method = paymentMethod;
    }

    if (receivedBy) {
      payment.received_by = receivedBy;
    }

    if (status) {
      payment.status = status;
    }

    if (req.file) {
      payment.receipt_image = `/uploads/receipts/${req.file.filename}`;
    }

    await payment.save();

    const fullPayment = await Payment.findByPk(payment.id, {
      include: [{ model: Customer, as: 'customer', attributes: ['id', 'name'] }]
    });

    return ApiResponse.success(res, fullPayment, 'Payment updated', 200);
  } catch (error) {
    console.error('Update payment error:', error);
    return ApiResponse.error(res, 'Server error', 500);
  }
};

const getAllPayments = async (req, res) => {
  try {
    let whereClause = {};
    if (req.companyId) {
      whereClause.company_id = req.companyId;
    }

    const payments = await Payment.findAll({
      where: whereClause,
      include: [{
        model: Customer,
        as: 'customer',
        attributes: ['id', 'name', 'pace_user_id', 'whatsapp_number']
      }],
      order: [['created_at', 'DESC']]
    });

    const transformedPayments = payments.map(payment => ({
      ...payment.toJSON(),
      customerName: payment.customer?.name || '',
      paceUserId: payment.customer?.pace_user_id || ''
    }));

    return ApiResponse.success(res, { payments: transformedPayments }, 'Payments fetched');
  } catch (error) {
    return ApiResponse.error(res, 'Failed to fetch payments', 500);
  }
};

const getPaymentsByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;

    // First verify the customer belongs to the current company
    const customer = await Customer.findOne({ 
      where: { 
        id: customerId, 
        company_id: req.companyId 
      } 
    });
    
    if (!customer) {
      return ApiResponse.error(res, 'Customer not found', 404);
    }

    const payments = await Payment.findAll({
      where: { 
        customer_id: customerId,
        company_id: req.companyId
      },
      include: [{ model: Customer, as: 'customer', attributes: ['name'] }],
      order: [['created_at', 'DESC']]
    });

    return ApiResponse.success(res, { payments }, 'Customer payments fetched');
  } catch (error) {
    return ApiResponse.error(res, 'Failed to fetch', 500);
  }
};

const deletePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findOne({ 
      where: { 
        id, 
        company_id: req.companyId 
      } 
    });
    if (!payment) {
      return ApiResponse.error(res, 'Payment not found', 404);
    }

    await payment.destroy();
    return ApiResponse.success(res, null, 'Payment deleted successfully');
  } catch (error) {
    console.error('Delete payment error:', error);
    return ApiResponse.error(res, 'Server error', 500);
  }
};

module.exports = {
  createPayment,
  updatePayment,
  deletePayment,
  getAllPayments,
  getPaymentsByCustomer
};