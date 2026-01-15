const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: process.env.DB_NAME || 'networking_dashboard',
  DB_PORT: process.env.DB_PORT || 3306,
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  SESSION_SECRET: process.env.SESSION_SECRET || '177b63ec25580e85574816d92243f782378b24af3abf4931ef35d7801245fd926538f7416eb8ba11192c382f27ab00ea05620e0789360b04c0b1ac7b9d09e3ca',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
};
