const nodemailer = require('nodemailer');
const ApiResponse = require('../helpers/responses');

// Create transporter using a free email service (Gmail or SMTP)
const createTransporter = () => {
  // Using Gmail with OAuth2 or App Password
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com',
      pass: process.env.EMAIL_PASS || 'your-app-password'
    }
  });
};

const sendAssignmentNotification = async (req, res, next) => {
  try {
    const { to, subject, message, assignedBy, technicianName, complaintId } = req.body;

    if (!to || !subject || !message) {
      return ApiResponse.badRequest(res, 'Email recipient, subject, and message are required');
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: to,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-bottom: 20px;">🔧 New Complaint Assignment</h2>
            
            <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
              <h3 style="color: #8a6d3b; margin: 0;">Complaint Details:</h3>
              <p style="margin: 10px 0;"><strong>Complaint ID:</strong> ${complaintId}</p>
              <p style="margin: 10px 0;"><strong>Assigned by:</strong> ${assignedBy}</p>
            </div>
            
            <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
              <h3 style="color: #1e40af; margin: 0;">📋 Action Required:</h3>
              <p style="margin: 10px 0; color: #374151;">${message}</p>
              <p style="margin: 10px 0;"><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/complaints-dashboard" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Complaint Dashboard</a></p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                This is an automated message from the PACE Telecom Complaint Management System.
                <br>Please do not reply to this email.
              </p>
            </div>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    console.log(`📧 Assignment notification sent to ${to} for complaint ${complaintId}`);
    
    return ApiResponse.success(res, null, 'Assignment notification sent successfully');

  } catch (error) {
    console.error('Error sending assignment notification:', error);
    return ApiResponse.serverError(res, 'Failed to send assignment notification');
  }
};

module.exports = {
  sendAssignmentNotification
};
