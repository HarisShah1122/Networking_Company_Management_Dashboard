const Sequelize = require('sequelize');
const sequelize = require('../config/database');

// Import all models
const Company       = require('./Company')(sequelize, Sequelize.DataTypes);
const User          = require('./User')(sequelize, Sequelize.DataTypes);
const Customer      = require('./Customer')(sequelize, Sequelize.DataTypes);
const Connection    = require('./Connection')(sequelize, Sequelize.DataTypes);
const Recharge      = require('./Recharge')(sequelize, Sequelize.DataTypes);
const Stock         = require('./Stock')(sequelize, Sequelize.DataTypes);
const Transaction   = require('./Transaction')(sequelize, Sequelize.DataTypes);
const Payment       = require('./Payment')(sequelize, Sequelize.DataTypes);
const ActivityLog   = require('./ActivityLog')(sequelize, Sequelize.DataTypes);
const Complaint     = require('./Complaint')(sequelize, Sequelize.DataTypes);
const Area          = require('./Area')(sequelize, Sequelize.DataTypes);
const PackageRenewal = require('./PackageRenewal')(sequelize, Sequelize.DataTypes);
const SLAPenalty    = require('./SLAPenalty')(sequelize, Sequelize.DataTypes);
const Session       = require('./Session')(sequelize, Sequelize.DataTypes);

// Collect all models in one object
const models = {
  Company,
  User,
  Customer,
  Connection,
  Recharge,
  Stock,
  Transaction,
  Payment,
  ActivityLog,
  Complaint,
  Area,
  PackageRenewal,
  SLAPenalty,
  Session,
  sequelize,
  Sequelize
};

// Wire up all associations (this is critical!)
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    // console.log(`[Models] Registering associations for: ${modelName}`);
    models[modelName].associate(models);
  }
});

module.exports = models;