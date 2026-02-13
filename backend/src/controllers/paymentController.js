const { v4: uuidv4 } = require('uuid');
const ApiResponse = require('../helpers/responses');
const { Payment, Customer, sequelize, Sequelize } = require('../models');
const { sendPaymentConfirmation } = require('../helpers/whatsappHelper');

const createPayment = async (req, res) => {
  const startTime = Date.now();
  console.log('🔄 Payment request received:', {
    method: req.method,
    url: req.url,
    body: req.body,
    headers: req.headers,
    user: req.user,
    companyId: req.companyId
  });
  
  let transaction = null;
  
  try {
    const { trxId, customerId, amount, status, receivedBy, paymentMethod, originalPaymentMethod } = req.body;

    // Enhanced validation
    if (!trxId || !customerId || !amount || !receivedBy) {
      return ApiResponse.error(res, 'trxId, customerId, amount, receivedBy required', 400);
    }

    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return ApiResponse.error(res, 'Amount must be a positive number', 400);
    }

    console.log(`🔄 Starting optimized payment transaction for TRX: ${trxId}, Customer: ${customerId}`);

    // Optimized transaction with reduced locking
    transaction = await sequelize.transaction({
      autocommit: false
    });

    // Optimized query pattern - remove unnecessary locks
    const [customer, existingPayment] = await Promise.all([
      Customer.findOne({ 
        where: { 
          id: customerId, 
          company_id: req.companyId 
        },
        transaction
        // Removed lock to prevent deadlocks
      }),
      Payment.findOne({ 
        where: { trx_id: trxId },
        transaction
        // Removed lock - unique constraint provides protection
      })
    ]);

    if (!customer) {
      throw new Error(`Customer ${customerId} not found`);
    }

    if (existingPayment) {
      throw new Error(`Duplicate TRX ID: ${trxId}`);
    }

    const receiptImage = req.file
      ? `/uploads/receipts/${req.file.filename}`
      : null;

    // Create payment with customer data in single query
    const payment = await Payment.create({
      id: uuidv4(),
      customer_id: customerId,
      company_id: req.companyId,
      amount: parseFloat(amount),
      payment_method: paymentMethod || 'cash',
      original_payment_method: originalPaymentMethod || paymentMethod || 'cash',
      received_by: receivedBy,
      trx_id: trxId,
      receipt_image: receiptImage,
      status: status || 'pending'
    }, { 
      transaction
    });

    // Get customer data separately to avoid complex includes
    const paymentWithCustomer = await Payment.findByPk(payment.id, {
      include: [{ model: Customer, as: 'customer', attributes: ['id', 'name', 'email'] }],
      transaction
    });

    // Commit transaction immediately
    await transaction.commit();
    console.log(`✅ Payment transaction committed for TRX: ${trxId}`);

    // Handle notifications asynchronously (don't block response)
    setImmediate(async () => {
      try {
        const notificationPromises = [];
        
        if (status === 'confirmed' || status === 'approved') {
          notificationPromises.push(
            sendPaymentConfirmation(customer.name, parseFloat(amount), payment.id)
              .catch(err => console.warn('⚠️ WhatsApp notification failed:', err.message))
          );
        }

        if ((status === 'confirmed' || status === 'approved') && customer.email) {
          notificationPromises.push(
            (async () => {
              try {
                const emailService = require('../services/email.service');
                await emailService.sendPaymentConfirmationNotification(
                  customer.email,
                  payment.toJSON()
                );
                console.log(`📧 Payment confirmation email sent to ${customer.email}`);
              } catch (emailError) {
                console.warn('⚠️ Failed to send payment confirmation email:', emailError.message);
              }
            })()
          );
        }

        await Promise.allSettled(notificationPromises);
      } catch (notifError) {
        console.warn('⚠️ Notification processing failed:', notifError.message);
      }
    });

    const duration = Date.now() - startTime;
    console.log(`✅ Payment created successfully in ${duration}ms`);

    return ApiResponse.success(res, paymentWithCustomer, 'Payment recorded', 201);

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Create payment error after ${duration}ms:`, {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      sql: error.sql,
      trxId: req.body?.trxId,
      customerId: req.body?.customerId,
      receivedBy: req.body?.receivedBy
    });

    // Rollback transaction if it exists
    if (transaction) {
      try {
        await transaction.rollback();
        console.log('🔄 Payment transaction rolled back');
      } catch (rollbackError) {
        console.error('❌ Transaction rollback failed:', rollbackError.message);
      }
    }

    // Enhanced error handling with specific timeout responses
    if (error.message.includes('timeout') || error.name === 'SequelizeTimeoutError') {
      return ApiResponse.error(res, 'Payment processing timed out. Please check your connection and try again.', 504);
    } else if (error.message.includes('Duplicate TRX ID')) {
      return ApiResponse.error(res, 'Duplicate transaction ID', 409);
    } else if (error.message.includes('not found')) {
      return ApiResponse.error(res, error.message, 404);
    } else if (error.name === 'SequelizeConnectionError') {
      return ApiResponse.error(res, 'Database connection error. Please try again.', 503);
    } else if (error.name === 'SequelizeConnectionTimedOutError') {
      return ApiResponse.error(res, 'Database connection timed out. Please try again.', 504);
    } else if (error.name === 'SequelizeUniqueConstraintError') {
      return ApiResponse.error(res, 'Duplicate transaction ID', 409);
    } else if (error.name === 'SequelizeValidationError') {
      return ApiResponse.error(res, `Validation error: ${error.message}`, 400);
    } else if (error.name === 'SequelizeDatabaseError') {
      return ApiResponse.error(res, 'Database error. Please try again.', 500);
    }
    
    // Log unknown errors for debugging
    console.error('🔍 Unknown payment error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      originalStack: error.stack
    });

    return ApiResponse.error(res, 'Payment processing failed. Please try again.', 500);
  }
};

const updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { trxId, customerId, amount, status, receivedBy, paymentMethod, originalPaymentMethod } = req.body;

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

    if (originalPaymentMethod) {
      payment.original_payment_method = originalPaymentMethod;
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