const { Sequelize } = require('sequelize');
const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } = require('./env');

// Create Sequelize instance
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'mysql',
  logging: false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Don't authenticate here - let server.js handle it
// This prevents premature connection attempts before env is fully loaded

module.exports = sequelize;