const { Sequelize } = require('sequelize');
const { 
  DB_HOST, 
  DB_PORT, 
  DB_NAME, 
  DB_USER, 
  DB_PASSWORD,
  NODE_ENV 
} = require('./env');

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'mysql',
  logging: NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

module.exports = sequelize;
