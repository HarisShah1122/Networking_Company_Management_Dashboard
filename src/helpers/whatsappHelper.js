const twilio = require('twilio');
const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;

// Hardcoded Twilio sender number
const TWILIO_WHATSAPP_FROM = '+923429055515';
// Hardcoded recipient number for testing
const TEST_TO_NUMBER = '+923429055515';

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);


const sendWhatsAppMessage = async (to, message) => {
  try {
    if (!message) return null;

    // Always send to your number
    const result = await client.messages.create({
      from: `whatsapp:${TWILIO_WHATSAPP_FROM}`,
      to: `whatsapp:${TEST_TO_NUMBER}`,
      body: message,
    });

    console.log(`WhatsApp message sent to ${TEST_TO_NUMBER}`);
    return result;
  } catch (error) {
    console.error('WhatsApp sending failed:', error.message);
    return null;
  }
};

module.exports = { sendWhatsAppMessage };