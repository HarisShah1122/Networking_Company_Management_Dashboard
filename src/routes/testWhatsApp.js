const express = require('express');
const { sendWhatsAppMessage, sendComplaintNotification, sendPaymentConfirmation, sendCustomerWelcome } = require('../helpers/whatsappHelper');
const router = express.Router();

// Test basic WhatsApp message
router.post('/send-message', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const result = await sendWhatsAppMessage(null, message);
    
    if (result) {
      res.json({ 
        success: true, 
        message: 'WhatsApp message sent successfully',
        data: result 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send WhatsApp message' 
      });
    }
  } catch (error) {
    console.error('Test WhatsApp error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// Test complaint notification
router.post('/test-complaint', async (req, res) => {
  try {
    const { customerName, complaintId, description } = req.body;
    
    const result = await sendComplaintNotification(
      customerName || 'Test Customer', 
      complaintId || 'TEST-001', 
      description || 'Test complaint description'
    );
    
    if (result) {
      res.json({ 
        success: true, 
        message: 'Complaint notification sent successfully',
        data: result 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send complaint notification' 
      });
    }
  } catch (error) {
    console.error('Test complaint notification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// Test payment confirmation
router.post('/test-payment', async (req, res) => {
  try {
    const { customerName, amount, paymentId } = req.body;
    
    const result = await sendPaymentConfirmation(
      customerName || 'Test Customer', 
      amount || '1000', 
      paymentId || 'PAY-001'
    );
    
    if (result) {
      res.json({ 
        success: true, 
        message: 'Payment confirmation sent successfully',
        data: result 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send payment confirmation' 
      });
    }
  } catch (error) {
    console.error('Test payment confirmation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// Test customer welcome
router.post('/test-welcome', async (req, res) => {
  try {
    const { customerName, paceUserId } = req.body;
    
    const result = await sendCustomerWelcome(
      customerName || 'Test Customer', 
      paceUserId || 'PACE-001-123456'
    );
    
    if (result) {
      res.json({ 
        success: true, 
        message: 'Welcome message sent successfully',
        data: result 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send welcome message' 
      });
    }
  } catch (error) {
    console.error('Test welcome message error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// Test WhatsApp template message
router.post('/test-template', async (req, res) => {
  try {
    const { templateName, parameters } = req.body;
    
    const result = await sendWhatsAppTemplate(
      null, 
      templateName || 'jaspers_market_order_confirmation_v1', 
      parameters || ['John Doe', '123456', 'Jan 27, 2026']
    );
    
    if (result) {
      res.json({ 
        success: true, 
        message: 'WhatsApp template sent successfully',
        data: result 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send WhatsApp template' 
      });
    }
  } catch (error) {
    console.error('Test WhatsApp template error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

module.exports = router;
