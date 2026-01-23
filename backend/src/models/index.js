const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const Company = require('./Company')(sequelize, Sequelize.DataTypes);
const User = require('./User')(sequelize, Sequelize.DataTypes);
const Customer = require('./Customer')(sequelize, Sequelize.DataTypes);
const Connection = require('./Connection')(sequelize, Sequelize.DataTypes);
const Recharge = require('./Recharge')(sequelize, Sequelize.DataTypes);
const Stock = require('./Stock')(sequelize, Sequelize.DataTypes);
const Transaction = require('./Transaction')(sequelize, Sequelize.DataTypes);
const Payment = require('./Payment')(sequelize, Sequelize.DataTypes);
const ActivityLog = require('./ActivityLog')(sequelize, Sequelize.DataTypes);
const Complaint = require('./Complaint')(sequelize, Sequelize.DataTypes);
const Area = require('./Area')(sequelize, Sequelize.DataTypes);
// Define associations
// Connection.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
// Customer.hasMany(Connection, { foreignKey: 'customer_id', as: 'connections' });

// Recharge.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
// Customer.hasMany(Recharge, { foreignKey: 'customer_id', as: 'recharges' });

// Transaction.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
// User.hasMany(Transaction, { foreignKey: 'created_by', as: 'transactions' });

// ActivityLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
// User.hasMany(ActivityLog, { foreignKey: 'user_id', as: 'activityLogs' });

Complaint.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
Customer.hasMany(Complaint, { foreignKey: 'customerId', as: 'complaints' });
Complaint.belongsTo(Connection, { foreignKey: 'connectionId', as: 'connection' });
Connection.hasMany(Complaint, { foreignKey: 'connectionId', as: 'complaints' });

if (Area.associate) Area.associate({ Customer, Connection });

module.exports = {
  sequelize,
  Sequelize,
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
  Area
};
