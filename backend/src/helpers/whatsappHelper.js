const axios = require('axios');

const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_API_URL = `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`;

const TEST_TO_NUMBER = process.env.WHATSAPP_TEST_NUMBER;

const sendWhatsAppMessage = async (to, message) => {
  try {
    if (!message) return null;

    const recipientNumber = TEST_TO_NUMBER;
    
    const templatePayload = {
      messaging_product: 'whatsapp',
      to: recipientNumber.replace('+', ''),
      type: 'template',
      template: {
        name: 'hello_world',
        language: {
          code: 'en_US'
        }
      }
    };

    try {
      const response = await axios.post(WHATSAPP_API_URL, templatePayload, {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`WhatsApp template sent to ${recipientNumber}:`, response.data);
      return response.data;
    } catch (templateError) {
      console.log('Template failed, trying text message:', templateError.response?.data);
      
      const textPayload = {
        messaging_product: 'whatsapp',
        to: recipientNumber.replace('+', ''),
        type: 'text',
        text: {
          body: message
        }
      };

      const response = await axios.post(WHATSAPP_API_URL, textPayload, {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`WhatsApp text sent to ${recipientNumber}:`, response.data);
      return response.data;
    }
  } catch (error) {
    console.error('WhatsApp sending failed:', error.response?.data || error.message);
    return null;
  }
};

const sendWhatsAppTemplate = async (to, templateName, parameters = []) => {
  try {
    const recipientNumber = TEST_TO_NUMBER;
    
    const payload = {
      messaging_product: 'whatsapp',
      to: recipientNumber.replace('+', ''),
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: 'en_US'
        },
        components: [{
          type: 'body',
          parameters: parameters.map(param => ({
            type: 'text',
            text: param
          }))
        }]
      }
    };

    const response = await axios.post(WHATSAPP_API_URL, payload, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`WhatsApp template sent to ${recipientNumber}:`, response.data);
    return response.data;
  } catch (error) {
    console.error('WhatsApp template sending failed:', error.response?.data || error.message);
    return null;
  }
};

const sendComplaintNotification = async (customerName, complaintId, description) => {
  try {
    const recipientNumber = TEST_TO_NUMBER;
    
    const message = `📢 New Complaint Received!\n\nCustomer: ${customerName}\nComplaint ID: ${complaintId}\nIssue: ${description}\n\nPlease check the dashboard for details.`;
    
    const payload = {
      messaging_product: 'whatsapp',
      to: recipientNumber.replace('+', ''),
      type: 'text',
      text: {
        body: message
      }
    };

    const response = await axios.post(WHATSAPP_API_URL, payload, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`Complaint notification sent to ${recipientNumber}:`, response.data);
    return response.data;
  } catch (error) {
    console.error('Complaint notification failed:', error.response?.data || error.message);
    return null;
  }
};

const sendPaymentConfirmation = async (customerName, amount, paymentId) => {
  const message = `💰 Payment Confirmation\n\nCustomer: ${customerName}\nAmount: RS ${amount}\nPayment ID: ${paymentId}\nStatus: Confirmed\n\nThank you for your payment!`;
  return await sendWhatsAppMessage(null, message);
};

const sendCustomerWelcome = async (customerName, paceUserId) => {
  const message = `🎉 Welcome to PACE Telecom!\n\nDear ${customerName},\nYour account has been created successfully.\n\nPACE USER ID: ${paceUserId}\n\nThank you for choosing PACE Telecom!`;
  return await sendWhatsAppMessage(null, message);
};

module.exports = { 
  sendWhatsAppMessage, 
  sendWhatsAppTemplate,
  sendComplaintNotification,
  sendPaymentConfirmation,
  sendCustomerWelcome
};