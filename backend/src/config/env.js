const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const {
  NODE_ENV = 'development',
  PORT = 5000,
  DB_HOST = 'localhost',
  DB_PORT = 3306,
  DB_NAME = 'networking_dashboard',
  DB_USER = 'root',
  DB_PASSWORD = '',
  JWT_SECRET = 'your-super-secret-jwt-key-change-in-production',
  JWT_EXPIRES_IN = '24h',
  SESSION_SECRET = 'your-super-secret-session-key-change-in-production',
  CORS_ORIGIN = 'http://localhost:3000',
  TWILIO_ACCOUNT_SID = '',
  TWILIO_AUTH_TOKEN = '',
  TWILIO_PHONE_NUMBER = '',
  WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0',
  WHATSAPP_ACCESS_TOKEN = '',
  WHATSAPP_PHONE_ID = '',
  WHATSAPP_VERIFY_TOKEN = ''
} = process.env;

module.exports = {
  NODE_ENV,
  PORT: parseInt(PORT),
  DB_HOST,
  DB_PORT: parseInt(DB_PORT),
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  SESSION_SECRET,
  CORS_ORIGIN,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
  WHATSAPP_API_URL,
  WHATSAPP_ACCESS_TOKEN,
  WHATSAPP_PHONE_ID,
  WHATSAPP_VERIFY_TOKEN
};
