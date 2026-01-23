const twilio = require('twilio');

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM } = process.env;

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

const sendWhatsAppMessage = async (to, message) => {
  try {
    if (!to || !message) return null;

    const result = await client.messages.create({
      from: `whatsapp:${TWILIO_WHATSAPP_FROM}`,
      to: `whatsapp:${to}`,
      body: message,
    });

    console.log(`WhatsApp message sent to ${to}`);
    return result;
  } catch (error) {
    console.error('WhatsApp sending failed:', error.message);
    return null;
  }
};

module.exports = { sendWhatsAppMessage };