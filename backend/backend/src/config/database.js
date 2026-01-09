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

// Test connection
sequelize.authenticate()
  .then(() => {
    console.log('✅ MySQL database connected successfully (Sequelize)');
  })
  .catch(err => {
    console.error('❌ Database connection error:', err.message);
    process.exit(1);
  });

module.exports = sequelize;
