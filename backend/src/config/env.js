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
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || 'Root@medimpact_mysql_user',
  DB_NAME: process.env.DB_NAME || 'networking_dashboard',
  DB_PORT: process.env.DB_PORT || 3306,
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  SESSION_SECRET: process.env.SESSION_SECRET || '177b63ec25580e85574816d92243f782378b24af3abf4931ef35d7801245fd926538f7416eb8ba11192c382f27ab00ea05620e0789360b04c0b1ac7b9d09e3ca',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || '',
  WHATSAPP_API_URL: process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0',
  WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN || '',
  WHATSAPP_PHONE_ID: process.env.WHATSAPP_PHONE_ID || '',
  WHATSAPP_VERIFY_TOKEN: process.env.WHATSAPP_VERIFY_TOKEN || ''
};
