const { Sequelize } = require('sequelize');

// Try to load local config first, fallback to environment variables
let config;
try {
  config = require('./database-local.js');
  console.log('✅ Using local database config');
} catch (error) {
  console.log('⚠️ Using environment variables for database config');
  const { 
    DB_HOST, 
    DB_PORT, 
    DB_NAME, 
    DB_USER, 
    DB_PASSWORD,
    NODE_ENV 
  } = require('./env');
  
  config = {
    username: DB_USER || 'root',
    password: DB_PASSWORD || '',
    database: DB_NAME || 'networking_dashboard',
    host: DB_HOST || 'localhost',
    dialect: 'mysql',
    port: parseInt(DB_PORT) || 3306,
    NODE_ENV: NODE_ENV || 'development'
  };
}

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  port: config.port,
  dialect: config.dialect,
  logging: config.NODE_ENV === 'development' ? console.log : false,
  
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
  benchmark: config.NODE_ENV === 'development',
  define: {
    timestamps: true,
    underscored: false  // Changed to false to match camelCase database columns
  }
});

module.exports = sequelize;
