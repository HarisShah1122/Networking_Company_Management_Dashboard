const nodemailer = require('nodemailer');
const { EMAIL_HOST, EMAIL_PORT, EMAIL_SECURE, EMAIL_USER, EMAIL_PASS, EMAIL_FROM, FRONTEND_URL } = require('../config/env');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.initializeTransporter();
  }

  initializeTransporter() {
    if (!EMAIL_USER || !EMAIL_PASS) {
      console.warn('⚠️ Email credentials not configured. Email notifications will be disabled.');
      this.isConfigured = false;
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: EMAIL_HOST,
        port: EMAIL_PORT,
        secure: EMAIL_SECURE,
        auth: {
          user: EMAIL_USER,
          pass: EMAIL_PASS
        },
        tls: {
          rejectUnauthorized: false
        }
      });
      this.isConfigured = true;
      console.log('✅ Email service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error.message);
      this.isConfigured = false;
    }
  }

  async verifyConnection() {
    if (!this.isConfigured) {
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('✅ Email server connection verified');
      return true;
    } catch (error) {
      console.error('❌ Email server connection failed:', error.message);
      return false;
    }
  }

  async sendEmail(to, subject, html, text = null) {
    if (!this.isConfigured) {
      console.warn('⚠️ Email service not configured. Skipping email send to:', to);
      return { success: false, message: 'Email service not configured' };
    }

    try {
      const mailOptions = {
        from: EMAIL_FROM,
        to: to,
        subject: subject,
        html: html,
        text: text
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`📧 Email sent successfully to ${to}:`, result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error(`❌ Failed to send email to ${to}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  // Complaint Assignment Notification
  async sendComplaintAssignmentNotification(technicianEmail, technicianName, complaintDetails, assignedBy) {
    const subject = `🔧 New Complaint Assigned - ID: ${complaintDetails.id}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1e40af; margin: 0;">🔧 PACE Telecom</h1>
            <p style="color: #6b7280; margin: 5px 0;">Complaint Management System</p>
          </div>
          
          <h2 style="color: #333; margin-bottom: 20px;">New Complaint Assignment</h2>
          
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
            <h3 style="color: #92400e; margin: 0;">📋 Complaint Details:</h3>
            <p style="margin: 10px 0;"><strong>ID:</strong> ${complaintDetails.id}</p>
            <p style="margin: 10px 0;"><strong>Title:</strong> ${complaintDetails.title}</p>
            <p style="margin: 10px 0;"><strong>Priority:</strong> <span style="background-color: #f59e0b; color: white; padding: 2px 8px; border-radius: 3px; font-size: 12px;">${complaintDetails.priority?.toUpperCase()}</span></p>
            <p style="margin: 10px 0;"><strong>Customer:</strong> ${complaintDetails.name || 'N/A'}</p>
            <p style="margin: 10px 0;"><strong>Address:</strong> ${complaintDetails.address || 'N/A'}</p>
          </div>
          
          <div style="background-color: #dbeafe; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #3b82f6;">
            <h3 style="color: #1e40af; margin: 0;">👤 Assignment Info:</h3>
            <p style="margin: 10px 0;"><strong>Assigned by:</strong> ${assignedBy}</p>
            <p style="margin: 10px 0;"><strong>Assigned to:</strong> ${technicianName}</p>
            <p style="margin: 10px 0;"><strong>Assigned at:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <h3 style="color: #374151; margin: 0;">📝 Description:</h3>
            <p style="margin: 10px 0; color: #4b5563;">${complaintDetails.description}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${FRONTEND_URL}/complaints-dashboard" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Complaint Dashboard</a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              This is an automated message from the PACE Telecom Complaint Management System.
              <br>Please do not reply to this email. For support, contact your system administrator.
            </p>
          </div>
        </div>
      </div>
    `;

    return await this.sendEmail(technicianEmail, subject, html);
  }

  // New Complaint Confirmation Notification
  async sendComplaintCreationNotification(customerEmail, customerName, complaintDetails) {
    const subject = `📢 New Complaint Registered - ${complaintDetails.id}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1e40af; margin: 0;">📢 PACE Telecom</h1>
            <p style="color: #6b7280; margin: 5px 0;">Complaint Management System</p>
          </div>
          
          <h2 style="color: #333; margin-bottom: 20px;">Complaint Registered Successfully</h2>
          
          <div style="background-color: #d1fae5; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #10b981;">
            <h3 style="color: #065f46; margin: 0;">✅ Complaint Details:</h3>
            <p style="margin: 10px 0;"><strong>Complaint ID:</strong> ${complaintDetails.id}</p>
            <p style="margin: 10px 0;"><strong>Title:</strong> ${complaintDetails.title}</p>
            <p style="margin: 10px 0;"><strong>Customer:</strong> ${customerName || 'N/A'}</p>
            ${complaintDetails.customer?.father_name ? `<p style="margin: 10px 0;"><strong>Father Name:</strong> ${complaintDetails.customer.father_name}</p>` : ''}
            ${complaintDetails.customer?.phone ? `<p style="margin: 10px 0;"><strong>Phone:</strong> ${complaintDetails.customer.phone}</p>` : ''}
            ${complaintDetails.customer?.email ? `<p style="margin: 10px 0;"><strong>Email:</strong> ${complaintDetails.customer.email}</p>` : ''}
            ${complaintDetails.customer?.pace_user_id ? `<p style="margin: 10px 0;"><strong>Customer ID:</strong> ${complaintDetails.customer.pace_user_id}</p>` : ''}
          </div>

          ${complaintDetails.customer?.address || complaintDetails.address ? `
          <div style="background-color: #e0f2fe; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #0284c7;">
            <h3 style="color: #075985; margin: 0;">📍 Address Information:</h3>
            <p style="margin: 10px 0;"><strong>Address:</strong> ${complaintDetails.customer?.address || complaintDetails.address}</p>
          </div>
          ` : ''}
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <h3 style="color: #374151; margin: 0;">📝 Description:</h3>
            <p style="margin: 10px 0; color: #4b5563;">${complaintDetails.description}</p>
          </div>
          
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
            <h3 style="color: #92400e; margin: 0;">📋 Important Information:</h3>
            <ul style="margin: 10px 0; color: #4b5563;">
              <li>Your complaint has been registered successfully</li>
              <li>We will review your complaint and assign it to our technical team</li>
              <li>You will receive updates on the progress via email and WhatsApp</li>
              <li>For urgent issues, please call our support line</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${FRONTEND_URL}/complaint-status/${complaintDetails.id}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Track Complaint Status</a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              This is an automated message from PACE Telecom Complaint Management System.
              If you have any questions, please contact our support team.
            </p>
          </div>
        </div>
      </div>
    `;

    return await this.sendEmail(customerEmail, subject, html);
  }

  // Complaint Status Update Notification
  async sendComplaintStatusUpdateNotification(customerEmail, customerName, complaintDetails, oldStatus, newStatus) {
    const subject = `📢 Complaint Status Update - ${complaintDetails.customer?.name || customerName || 'Customer'}`;
    const statusColors = {
      'open': '#f59e0b',
      'in_progress': '#3b82f6',
      'resolved': '#10b981',
      'closed': '#6b7280'
    };

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1e40af; margin: 0;">📢 PACE Telecom</h1>
            <p style="color: #6b7280; margin: 5px 0;">Complaint Management System</p>
          </div>
          
          <h2 style="color: #333; margin-bottom: 20px;">Complaint Status Update</h2>
          
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
            <h3 style="color: #92400e; margin: 0;">📋 Complaint Details:</h3>
            <p style="margin: 10px 0;"><strong>Complaint ID:</strong> ${complaintDetails.id}</p>
            <p style="margin: 10px 0;"><strong>Title:</strong> ${complaintDetails.title}</p>
            <p style="margin: 10px 0;"><strong>Customer:</strong> ${customerName || 'N/A'}</p>
            ${complaintDetails.customer?.father_name ? `<p style="margin: 10px 0;"><strong>Father Name:</strong> ${complaintDetails.customer.father_name}</p>` : ''}
            ${complaintDetails.customer?.phone ? `<p style="margin: 10px 0;"><strong>Phone:</strong> ${complaintDetails.customer.phone}</p>` : ''}
            ${complaintDetails.customer?.email ? `<p style="margin: 10px 0;"><strong>Email:</strong> ${complaintDetails.customer.email}</p>` : ''}
            ${complaintDetails.customer?.pace_user_id ? `<p style="margin: 10px 0;"><strong>Customer ID:</strong> ${complaintDetails.customer.pace_user_id}</p>` : ''}
          </div>

          ${complaintDetails.address || complaintDetails.area || complaintDetails.city || complaintDetails.district ? `
          <div style="background-color: #e0f2fe; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #0284c7;">
            <h3 style="color: #075985; margin: 0;">📍 Location Information:</h3>
            ${complaintDetails.address ? `<p style="margin: 10px 0;"><strong>Address:</strong> ${complaintDetails.address}</p>` : ''}
            ${complaintDetails.area ? `<p style="margin: 10px 0;"><strong>Area:</strong> ${complaintDetails.area}</p>` : ''}
            ${complaintDetails.city ? `<p style="margin: 10px 0;"><strong>City:</strong> ${complaintDetails.city}</p>` : ''}
            ${complaintDetails.district ? `<p style="margin: 10px 0;"><strong>District:</strong> ${complaintDetails.district}</p>` : ''}
            ${complaintDetails.landmark ? `<p style="margin: 10px 0;"><strong>Landmark:</strong> ${complaintDetails.landmark}</p>` : ''}
          </div>
          ` : ''}
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <h3 style="color: #374151; margin: 0;">🔄 Status Change:</h3>
            <div style="display: flex; align-items: center; margin: 10px 0;">
              <span style="background-color: ${statusColors[oldStatus] || '#6b7280'}; color: white; padding: 4px 12px; border-radius: 15px; font-size: 12px; margin-right: 10px;">${(oldStatus || '').replace('_', ' ').toUpperCase()}</span>
              <span style="font-size: 18px; color: #6b7280;">→</span>
              <span style="background-color: ${statusColors[newStatus] || '#6b7280'}; color: white; padding: 4px 12px; border-radius: 15px; font-size: 12px; margin-left: 10px;">${(newStatus || '').replace('_', ' ').toUpperCase()}</span>
            </div>
            <p style="margin: 10px 0; color: #4b5563;"><strong>Updated at:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          ${newStatus === 'resolved' || newStatus === 'closed' ? `
          <div style="background-color: #d1fae5; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #10b981;">
            <h3 style="color: #065f46; margin: 0;">✅ Issue Resolved!</h3>
            <p style="margin: 10px 0; color: #047857;">Your complaint has been marked as ${newStatus.replace('_', ' ')}. We hope the issue has been resolved to your satisfaction.</p>
          </div>
          ` : ''}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${FRONTEND_URL}/complaint-status/${complaintDetails.id}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Track Complaint Status</a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              This is an automated message from PACE Telecom Complaint Management System.
              If you have any questions, please contact our support team.
            </p>
          </div>
        </div>
      </div>
    `;

    return await this.sendEmail(customerEmail, subject, html);
  }

  // Payment Confirmation Notification
  async sendPaymentConfirmationNotification(customerEmail, paymentDetails) {
    const subject = `💰 Payment Confirmation - ID: ${paymentDetails.id}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1e40af; margin: 0;">💰 PACE Telecom</h1>
            <p style="color: #6b7280; margin: 5px 0;">Payment Confirmation</p>
          </div>
          
          <h2 style="color: #333; margin-bottom: 20px;">Payment Received Successfully</h2>
          
          <div style="background-color: #d1fae5; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #10b981;">
            <h3 style="color: #065f46; margin: 0;">✅ Payment Details:</h3>
            <p style="margin: 10px 0;"><strong>Payment ID:</strong> ${paymentDetails.id}</p>
            <p style="margin: 10px 0;"><strong>Transaction ID:</strong> ${paymentDetails.trx_id}</p>
            <p style="margin: 10px 0;"><strong>Amount:</strong> <span style="color: #059669; font-size: 18px; font-weight: bold;">RS ${parseFloat(paymentDetails.amount).toFixed(2)}</span></p>
            <p style="margin: 10px 0;"><strong>Payment Method:</strong> ${paymentDetails.payment_method?.replace('_', ' ').toUpperCase()}</p>
            <p style="margin: 10px 0;"><strong>Status:</strong> <span style="background-color: #10b981; color: white; padding: 2px 8px; border-radius: 3px; font-size: 12px;">${paymentDetails.status?.toUpperCase()}</span></p>
            <p style="margin: 10px 0;"><strong>Received at:</strong> ${new Date(paymentDetails.created_at).toLocaleString()}</p>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <h3 style="color: #374151; margin: 0;">📝 Note:</h3>
            <p style="margin: 10px 0; color: #4b5563;">Thank you for your payment. Your account has been updated accordingly.</p>
            <p style="margin: 10px 0; color: #4b5563;">Please keep this receipt for your records.</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${FRONTEND_URL}/payment-history" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Payment History</a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              This is an automated message from the PACE Telecom Billing System.
              <br>Please do not reply to this email. For billing inquiries, contact our support team.
            </p>
          </div>
        </div>
      </div>
    `;

    return await this.sendEmail(customerEmail, subject, html);
  }

  // New Customer Welcome Notification
  async sendCustomerWelcomeNotification(customerEmail, customerDetails, companyDetails) {
    const subject = `🎉 Welcome to PACE Telecom!`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1e40af; margin: 0;">🎉 PACE Telecom</h1>
            <p style="color: #6b7280; margin: 5px 0;">Welcome aboard!</p>
          </div>
          
          <h2 style="color: #333; margin-bottom: 20px;">Welcome to PACE Telecom!</h2>
          
          <div style="background-color: #dbeafe; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #3b82f6;">
            <h3 style="color: #1e40af; margin: 0;">👋 Dear ${customerDetails.name},</h3>
            <p style="margin: 10px 0; color: #1e40af;">Thank you for choosing PACE Telecom as your internet service provider!</p>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <h3 style="color: #374151; margin: 0;">📋 Your Account Details:</h3>
            <p style="margin: 10px 0;"><strong>Customer ID:</strong> ${customerDetails.id}</p>
            <p style="margin: 10px 0;"><strong>Name:</strong> ${customerDetails.name}</p>
            <p style="margin: 10px 0;"><strong>Email:</strong> ${customerDetails.email}</p>
            <p style="margin: 10px 0;"><strong>Phone:</strong> ${customerDetails.phone}</p>
            <p style="margin: 10px 0;"><strong>Address:</strong> ${customerDetails.address}</p>
          </div>
          
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
            <h3 style="color: #92400e; margin: 0;">🏢 Company Information:</h3>
            <p style="margin: 10px 0;"><strong>Provider:</strong> ${companyDetails.name}</p>
            <p style="margin: 10px 0;"><strong>Contact:</strong> ${companyDetails.email}</p>
          </div>
          
          <div style="background-color: #d1fae5; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #10b981;">
            <h3 style="color: #065f46; margin: 0;">🚀 Next Steps:</h3>
            <ul style="margin: 10px 0; color: #047857;">
              <li>Your account has been successfully created</li>
              <li>You will receive connection details shortly</li>
              <li>For any issues, please contact our support team</li>
              <li>Visit our customer portal for account management</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${FRONTEND_URL}/customer-portal" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Access Customer Portal</a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              This is an automated message from the PACE Telecom Customer Management System.
              <br>Please do not reply to this email. For support, contact our customer service team.
            </p>
          </div>
        </div>
      </div>
    `;

    return await this.sendEmail(customerEmail, subject, html);
  }

  // SLA Breach Warning Notification
  async sendSLABreachWarningNotification(technicianEmail, technicianName, complaintDetails, slaDeadline) {
    const subject = `⚠️ SLA Breach Warning - Complaint: ${complaintDetails.id}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #dc2626; margin: 0;">⚠️ PACE Telecom</h1>
            <p style="color: #6b7280; margin: 5px 0;">SLA Management Alert</p>
          </div>
          
          <h2 style="color: #dc2626; margin-bottom: 20px;">⚠️ SLA Breach Warning</h2>
          
          <div style="background-color: #fef2f2; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #dc2626;">
            <h3 style="color: #991b1b; margin: 0;">🚨 Urgent Attention Required!</h3>
            <p style="margin: 10px 0; color: #991b1b;">The following complaint is approaching or has breached its SLA deadline:</p>
          </div>
          
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
            <h3 style="color: #92400e; margin: 0;">📋 Complaint Details:</h3>
            <p style="margin: 10px 0;"><strong>ID:</strong> ${complaintDetails.id}</p>
            <p style="margin: 10px 0;"><strong>Title:</strong> ${complaintDetails.title}</p>
            <p style="margin: 10px 0;"><strong>Priority:</strong> <span style="background-color: #f59e0b; color: white; padding: 2px 8px; border-radius: 3px; font-size: 12px;">${complaintDetails.priority?.toUpperCase()}</span></p>
            <p style="margin: 10px 0;"><strong>Customer:</strong> ${complaintDetails.name || 'N/A'}</p>
            <p style="margin: 10px 0;"><strong>Status:</strong> <span style="background-color: #3b82f6; color: white; padding: 2px 8px; border-radius: 3px; font-size: 12px;">${complaintDetails.status?.replace('_', ' ').toUpperCase()}</span></p>
          </div>
          
          <div style="background-color: #fee2e2; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #dc2626;">
            <h3 style="color: #991b1b; margin: 0;">⏰ SLA Information:</h3>
            <p style="margin: 10px 0;"><strong>Assigned at:</strong> ${new Date(complaintDetails.assigned_at).toLocaleString()}</p>
            <p style="margin: 10px 0;"><strong>SLA Deadline:</strong> ${new Date(slaDeadline).toLocaleString()}</p>
            <p style="margin: 10px 0;"><strong>Time Remaining:</strong> <span style="color: #dc2626; font-weight: bold;">${this.calculateTimeRemaining(slaDeadline)}</span></p>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <h3 style="color: #374151; margin: 0;">📝 Recommended Actions:</h3>
            <ul style="margin: 10px 0; color: #4b5563;">
              <li>Immediately assess the complaint status</li>
              <li>Contact the customer if needed</li>
              <li>Update the complaint status with progress</li>
              <li>Escalate if additional resources are required</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${FRONTEND_URL}/complaints-dashboard" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Complaint Dashboard</a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              This is an automated SLA monitoring alert from the PACE Telecom Complaint Management System.
              <br>Please do not reply to this email. For system support, contact your administrator.
            </p>
          </div>
        </div>
      </div>
    `;

    return await this.sendEmail(technicianEmail, subject, html);
  }

  calculateTimeRemaining(deadline) {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffMs = deadlineDate - now;
    
    if (diffMs <= 0) {
      return 'BREACHED';
    }
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 24) {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ${diffHours % 24}h ${diffMinutes}m`;
    }
    
    return `${diffHours}h ${diffMinutes}m`;
  }

  // Generic notification method
  async sendGenericNotification(to, subject, message, actionUrl = null, actionText = 'View Details') {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1e40af; margin: 0;">📢 PACE Telecom</h1>
            <p style="color: #6b7280; margin: 5px 0;">Notification System</p>
          </div>
          
          <h2 style="color: #333; margin-bottom: 20px;">${subject}</h2>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <p style="margin: 10px 0; color: #4b5563; line-height: 1.6;">${message}</p>
          </div>
          
          ${actionUrl ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${actionUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">${actionText}</a>
          </div>
          ` : ''}
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              This is an automated message from the PACE Telecom Management System.
              <br>Please do not reply to this email. For support, contact your system administrator.
            </p>
          </div>
        </div>
      </div>
    `;

    return await this.sendEmail(to, subject, html);
  }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService;
