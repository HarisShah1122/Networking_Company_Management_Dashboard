const ApiResponse = require('../helpers/responses');
const emailService = require('../services/email.service');
const { User } = require('../models');

const sendAssignmentNotification = async (req, res, next) => {
  try {
    const { technicianId, complaintId, message, assignedBy } = req.body;

    if (!technicianId || !complaintId || !message || !assignedBy) {
      return ApiResponse.badRequest(res, 'technicianId, complaintId, message, and assignedBy are required');
    }

    // Get technician details
    const technician = await User.findByPk(technicianId, {
      attributes: ['id', 'email', 'username', 'name']
    });

    if (!technician) {
      return ApiResponse.error(res, 'Technician not found', 404);
    }

    // Get complaint details
    const { Complaint } = require('../models');
    const complaint = await Complaint.findByPk(complaintId);

    if (!complaint) {
      return ApiResponse.error(res, 'Complaint not found', 404);
    }

    // Send email notification
    const emailResult = await emailService.sendComplaintAssignmentNotification(
      technician.email,
      technician.username || technician.name,
      complaint.toJSON(),
      assignedBy
    );

    if (emailResult.success) {
      console.log(`📧 Assignment notification sent to ${technician.email} for complaint ${complaintId}`);
      return ApiResponse.success(res, { messageId: emailResult.messageId }, 'Assignment notification sent successfully');
    } else {
      console.warn('⚠️ Email notification failed:', emailResult.error);
      return ApiResponse.success(res, { warning: 'Email notification failed, but assignment was recorded' }, 'Assignment recorded (email notification failed)');
    }

  } catch (error) {
    console.error('Error sending assignment notification:', error);
    return ApiResponse.serverError(res, 'Failed to send assignment notification');
  }
};

const sendComplaintStatusUpdateNotification = async (req, res, next) => {
  try {
    const { customerId, complaintId, oldStatus, newStatus } = req.body;

    if (!customerId || !complaintId || !oldStatus || !newStatus) {
      return ApiResponse.badRequest(res, 'customerId, complaintId, oldStatus, and newStatus are required');
    }

    // Get customer details
    const { Customer } = require('../models');
    const customer = await Customer.findByPk(customerId, {
      attributes: ['id', 'email', 'name']
    });

    if (!customer || !customer.email) {
      return ApiResponse.error(res, 'Customer not found or no email address', 404);
    }

    // Get complaint details
    const { Complaint } = require('../models');
    const complaint = await Complaint.findByPk(complaintId);

    if (!complaint) {
      return ApiResponse.error(res, 'Complaint not found', 404);
    }

    // Send email notification
    const emailResult = await emailService.sendComplaintStatusUpdateNotification(
      customer.email,
      complaint.toJSON(),
      oldStatus,
      newStatus
    );

    if (emailResult.success) {
      console.log(`📧 Status update notification sent to ${customer.email} for complaint ${complaintId}`);
      return ApiResponse.success(res, { messageId: emailResult.messageId }, 'Status update notification sent successfully');
    } else {
      console.warn('⚠️ Email notification failed:', emailResult.error);
      return ApiResponse.success(res, { warning: 'Email notification failed' }, 'Status updated (email notification failed)');
    }

  } catch (error) {
    console.error('Error sending status update notification:', error);
    return ApiResponse.serverError(res, 'Failed to send status update notification');
  }
};

const sendPaymentConfirmationNotification = async (req, res, next) => {
  try {
    const { customerId, paymentId } = req.body;

    if (!customerId || !paymentId) {
      return ApiResponse.badRequest(res, 'customerId and paymentId are required');
    }

    // Get customer details
    const { Customer } = require('../models');
    const customer = await Customer.findByPk(customerId, {
      attributes: ['id', 'email', 'name']
    });

    if (!customer || !customer.email) {
      return ApiResponse.error(res, 'Customer not found or no email address', 404);
    }

    // Get payment details
    const { Payment } = require('../models');
    const payment = await Payment.findByPk(paymentId);

    if (!payment) {
      return ApiResponse.error(res, 'Payment not found', 404);
    }

    // Send email notification
    const emailResult = await emailService.sendPaymentConfirmationNotification(
      customer.email,
      payment.toJSON()
    );

    if (emailResult.success) {
      console.log(`📧 Payment confirmation sent to ${customer.email} for payment ${paymentId}`);
      return ApiResponse.success(res, { messageId: emailResult.messageId }, 'Payment confirmation sent successfully');
    } else {
      console.warn('⚠️ Email notification failed:', emailResult.error);
      return ApiResponse.success(res, { warning: 'Email notification failed' }, 'Payment processed (email notification failed)');
    }

  } catch (error) {
    console.error('Error sending payment confirmation:', error);
    return ApiResponse.serverError(res, 'Failed to send payment confirmation');
  }
};

const sendCustomerWelcomeNotification = async (req, res, next) => {
  try {
    const { customerId, companyId } = req.body;

    if (!customerId || !companyId) {
      return ApiResponse.badRequest(res, 'customerId and companyId are required');
    }

    // Get customer details
    const { Customer } = require('../models');
    const customer = await Customer.findByPk(customerId);

    if (!customer || !customer.email) {
      return ApiResponse.error(res, 'Customer not found or no email address', 404);
    }

    // Get company details
    const { Company } = require('../models');
    const company = await Company.findByPk(companyId);

    if (!company) {
      return ApiResponse.error(res, 'Company not found', 404);
    }

    // Send email notification
    const emailResult = await emailService.sendCustomerWelcomeNotification(
      customer.email,
      customer.toJSON(),
      company.toJSON()
    );

    if (emailResult.success) {
      console.log(`📧 Welcome email sent to ${customer.email} for customer ${customerId}`);
      return ApiResponse.success(res, { messageId: emailResult.messageId }, 'Welcome email sent successfully');
    } else {
      console.warn('⚠️ Email notification failed:', emailResult.error);
      return ApiResponse.success(res, { warning: 'Email notification failed' }, 'Customer created (welcome email failed)');
    }

  } catch (error) {
    console.error('Error sending welcome email:', error);
    return ApiResponse.serverError(res, 'Failed to send welcome email');
  }
};

const sendSLABreachWarningNotification = async (req, res, next) => {
  try {
    const { technicianId, complaintId, slaDeadline } = req.body;

    if (!technicianId || !complaintId || !slaDeadline) {
      return ApiResponse.badRequest(res, 'technicianId, complaintId, and slaDeadline are required');
    }

    // Get technician details
    const technician = await User.findByPk(technicianId, {
      attributes: ['id', 'email', 'username', 'name']
    });

    if (!technician) {
      return ApiResponse.error(res, 'Technician not found', 404);
    }

    // Get complaint details
    const { Complaint } = require('../models');
    const complaint = await Complaint.findByPk(complaintId);

    if (!complaint) {
      return ApiResponse.error(res, 'Complaint not found', 404);
    }

    // Send email notification
    const emailResult = await emailService.sendSLABreachWarningNotification(
      technician.email,
      technician.username || technician.name,
      complaint.toJSON(),
      slaDeadline
    );

    if (emailResult.success) {
      console.log(`📧 SLA breach warning sent to ${technician.email} for complaint ${complaintId}`);
      return ApiResponse.success(res, { messageId: emailResult.messageId }, 'SLA breach warning sent successfully');
    } else {
      console.warn('⚠️ Email notification failed:', emailResult.error);
      return ApiResponse.success(res, { warning: 'Email notification failed' }, 'SLA breach detected (email notification failed)');
    }

  } catch (error) {
    console.error('Error sending SLA breach warning:', error);
    return ApiResponse.serverError(res, 'Failed to send SLA breach warning');
  }
};

const sendGenericNotification = async (req, res, next) => {
  try {
    const { to, subject, message, actionUrl, actionText } = req.body;

    if (!to || !subject || !message) {
      return ApiResponse.badRequest(res, 'to, subject, and message are required');
    }

    // Send email notification
    const emailResult = await emailService.sendGenericNotification(
      to,
      subject,
      message,
      actionUrl,
      actionText
    );

    if (emailResult.success) {
      console.log(`📧 Generic notification sent to ${to}`);
      return ApiResponse.success(res, { messageId: emailResult.messageId }, 'Notification sent successfully');
    } else {
      console.warn('⚠️ Email notification failed:', emailResult.error);
      return ApiResponse.serverError(res, 'Failed to send notification');
    }

  } catch (error) {
    console.error('Error sending generic notification:', error);
    return ApiResponse.serverError(res, 'Failed to send notification');
  }
};

const testEmailConfiguration = async (req, res, next) => {
  try {
    const { testEmail } = req.body;

    if (!testEmail) {
      return ApiResponse.badRequest(res, 'testEmail is required');
    }

    // Test email configuration
    const isConnected = await emailService.verifyConnection();

    if (!isConnected) {
      return ApiResponse.error(res, 'Email service not configured or connection failed', 503);
    }

    // Send test email
    const emailResult = await emailService.sendGenericNotification(
      testEmail,
      '📧 PACE Telecom - Email Configuration Test',
      'This is a test email to verify that the email notification system is working correctly.\n\nIf you receive this email, the configuration is successful!',
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`,
      'Go to Dashboard'
    );

    if (emailResult.success) {
      console.log(`📧 Test email sent to ${testEmail}`);
      return ApiResponse.success(res, { messageId: emailResult.messageId }, 'Test email sent successfully');
    } else {
      return ApiResponse.serverError(res, 'Failed to send test email');
    }

  } catch (error) {
    console.error('Error testing email configuration:', error);
    return ApiResponse.serverError(res, 'Failed to test email configuration');
  }
};

module.exports = {
  sendAssignmentNotification,
  sendComplaintStatusUpdateNotification,
  sendPaymentConfirmationNotification,
  sendCustomerWelcomeNotification,
  sendSLABreachWarningNotification,
  sendGenericNotification,
  testEmailConfiguration
};
