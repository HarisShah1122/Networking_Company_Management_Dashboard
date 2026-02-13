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
  
  // Optimized connection pool for cloud database
  pool: {
    max: 25,           // Increased for production
    min: 5,            // Keep minimum connections warm
    acquire: 60000,    // 60 seconds for cloud latency
    idle: 30000       // Keep idle connections longer
  },
  
  // MySQL2 compatible dialect options
  dialectOptions: {
    connectTimeout: 60000,
    multipleStatements: false,
    flags: '+FOUND_ROWS'
  },
  
  // Performance monitoring
  benchmark: NODE_ENV === 'development',
  define: {
    timestamps: true,
    underscored: false  // Changed to false to match camelCase database columns
  }
});

module.exports = sequelize;
