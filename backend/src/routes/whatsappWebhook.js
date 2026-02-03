const express = require('express');
const router = express.Router();
const { sendWhatsAppMessage } = require('../helpers/whatsappHelper');

// Webhook verification - WhatsApp will send this when you set up the webhook
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Verify webhook - you'll need to set this verify token in your WhatsApp Business settings
  const VERIFY_TOKEN = 'pace_telecom_verify_token_2026';

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

// Handle incoming WhatsApp messages
router.post('/', async (req, res) => {
  try {
    const data = req.body;

    // Check if this is a WhatsApp message
    if (data.object === 'whatsapp_business_account') {
      for (const entry of data.entry) {
        for (const change of entry.changes) {
          if (change.field === 'messages') {
            const messages = change.value.messages;
            
            if (messages && messages.length > 0) {
              for (const message of messages) {
                await processIncomingMessage(message, change.value);
              }
            }
          }
          
          // Handle message status updates (delivered, read, etc.)
          if (change.value.statuses) {
            for (const status of change.value.statuses) {
              await handleMessageStatus(status);
            }
          }
        }
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook error:', error);
    res.sendStatus(500);
  }
});

// Process incoming messages from customers
const processIncomingMessage = async (message, metadata) => {
  try {
    const from = message.from; // Customer's WhatsApp number
    const messageId = message.id;
    const timestamp = message.timestamp;
    const type = message.type;
    const contact = metadata.contacts?.find(c => c.wa_id === from);

    console.log('📩 Incoming WhatsApp Message:');
    console.log('From:', from);
    console.log('Type:', type);
    console.log('Message ID:', messageId);
    console.log('Contact:', contact);

    let messageContent = '';

    switch (type) {
      case 'text':
        messageContent = message.text.body;
        console.log('Text Message:', messageContent);
        await handleTextMessage(from, messageContent, contact);
        break;

      case 'image':
        messageContent = 'Image message received';
        console.log('Image Message:', message.image);
        await handleMediaMessage(from, 'image', message.image, contact);
        break;

      case 'document':
        messageContent = 'Document message received';
        console.log('Document Message:', message.document);
        await handleMediaMessage(from, 'document', message.document, contact);
        break;

      case 'audio':
        messageContent = 'Audio message received';
        console.log('Audio Message:', message.audio);
        await handleMediaMessage(from, 'audio', message.audio, contact);
        break;

      case 'video':
        messageContent = 'Video message received';
        console.log('Video Message:', message.video);
        await handleMediaMessage(from, 'video', message.video, contact);
        break;

      case 'location':
        messageContent = 'Location message received';
        console.log('Location Message:', message.location);
        await handleLocationMessage(from, message.location, contact);
        break;

      case 'contacts':
        messageContent = 'Contact message received';
        console.log('Contact Message:', message.contacts);
        await handleContactsMessage(from, message.contacts, contact);
        break;

      case 'interactive':
        messageContent = 'Interactive message received';
        console.log('Interactive Message:', message.interactive);
        await handleInteractiveMessage(from, message.interactive, contact);
        break;

      default:
        messageContent = `Unsupported message type: ${type}`;
        console.log('Unsupported Message Type:', type);
        await handleUnsupportedMessage(from, type, contact);
    }

    // Store message in database (you can implement this later)
    await storeIncomingMessage({
      from,
      messageId,
      type,
      content: messageContent,
      timestamp: new Date(parseInt(timestamp) * 1000),
      contact,
      metadata
    });

  } catch (error) {
    console.error('Error processing incoming message:', error);
  }
};

// Handle text messages
const handleTextMessage = async (from, message, contact) => {
  console.log(`📝 Text from ${from}: ${message}`);
  
  const autoReply = `Thank you for your message! 🙏\n\nOur team will review it and respond shortly.\n\nFor immediate assistance:\n📞 Call: 0342-4231806\n\n🌐 PACE Telecom`;
  
  await sendAutoReply(from, autoReply);
};

// Handle media messages (image, document, audio, video)
const handleMediaMessage = async (from, mediaType, media, contact) => {
  console.log(`📎 ${mediaType} received from ${from}`);
  
  const autoReply = `Thank you for your message! 🙏\n\nOur team will review it and respond shortly.\n\nFor immediate assistance:\n📞 Call: 0342-4231806\n\n🌐 PACE Telecom`;
  
  await sendAutoReply(from, autoReply);
};

// Handle location messages
const handleLocationMessage = async (from, location, contact) => {
  console.log(`📍 Location received from ${from}:`, location);
  
  const autoReply = `📍 Location received!\n\nThank you for sharing your location. Our team will use this for service delivery.\n\nFor immediate assistance: 0342-4231806`;
  
  await sendAutoReply(from, autoReply);
};

// Handle contact messages
const handleContactsMessage = async (from, contacts, contact) => {
  console.log(`👥 Contact shared from ${from}:`, contacts);
  
  const autoReply = `👥 Contact received!\n\nThank you for sharing the contact information. We'll save it for future reference.\n\nPACE Telecom Support`;
  
  await sendAutoReply(from, autoReply);
};

// Handle interactive messages (buttons, lists)
const handleInteractiveMessage = async (from, interactive, contact) => {
  console.log(`🔘 Interactive message from ${from}:`, interactive);
  
  const autoReply = `Thank you for your selection! ✅\n\nOur team will process your request and respond shortly.\n\nPACE Telecom`;
  
  await sendAutoReply(from, autoReply);
};

// Handle unsupported message types
const handleUnsupportedMessage = async (from, type, contact) => {
  console.log(`❌ Unsupported message type ${type} from ${from}`);
  
  const autoReply = `We received your message but this format is not yet supported. 📱\n\nPlease try sending a text message instead.\n\nFor immediate assistance: 0342-4231806`;
  
  await sendAutoReply(from, autoReply);
};

// Handle message status updates
const handleMessageStatus = async (status) => {
  console.log('📊 Message Status Update:');
  console.log('Message ID:', status.id);
  console.log('Status:', status.status);
  console.log('Timestamp:', status.timestamp);
  
  // You can store status updates in your database here
  await updateMessageStatus(status.id, status.status, status.timestamp);
};

// Send auto-reply using the existing WhatsApp helper
const sendAutoReply = async (to, message) => {
  try {
    await sendWhatsAppMessage(to, message);
    console.log(`📤 Auto-reply sent to ${to}`);
  } catch (error) {
    console.error('Failed to send auto-reply:', error);
  }
};

// Store incoming message in database (implement this based on your database schema)
const storeIncomingMessage = async (messageData) => {
  try {
    // TODO: Implement database storage
    console.log('💾 Storing message:', messageData);
    
    // Example implementation:
    // await IncomingMessage.create({
    //   from: messageData.from,
    //   message_id: messageData.messageId,
    //   type: messageData.type,
    //   content: messageData.content,
    //   timestamp: messageData.timestamp,
    //   contact_info: JSON.stringify(messageData.contact)
    // });
    
  } catch (error) {
    console.error('Failed to store message:', error);
  }
};

// Update message status in database
const updateMessageStatus = async (messageId, status, timestamp) => {
  try {
    // TODO: Implement status update in database
    console.log(`📊 Updating status for ${messageId} to ${status}`);
    
    // Example implementation:
    // await IncomingMessage.update(
    //   { status: status, status_timestamp: new Date(parseInt(timestamp) * 1000) },
    //   { where: { message_id: messageId } }
    // );
    
  } catch (error) {
    console.error('Failed to update message status:', error);
  }
};

module.exports = router;