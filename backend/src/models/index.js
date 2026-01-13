const Sequelize = require('sequelize');
const sequelize = require('../config/database');

// Import models and pass both `sequelize` and `Sequelize.DataTypes`
const User = require('./User')(sequelize, Sequelize.DataTypes);
const Customer = require('./Customer')(sequelize, Sequelize.DataTypes);
const Connection = require('./Connection')(sequelize, Sequelize.DataTypes);
const Recharge = require('./Recharge')(sequelize, Sequelize.DataTypes);
const Stock = require('./Stock')(sequelize, Sequelize.DataTypes);
const Transaction = require('./Transaction')(sequelize, Sequelize.DataTypes);
const ActivityLog = require('./ActivityLog')(sequelize, Sequelize.DataTypes);
const Complaint = require('./Complaint')(sequelize, Sequelize.DataTypes);
const Area = require('./Area')(sequelize, Sequelize.DataTypes);
// Define associations
Connection.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
Customer.hasMany(Connection, { foreignKey: 'customer_id', as: 'connections' });

Recharge.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
Customer.hasMany(Recharge, { foreignKey: 'customer_id', as: 'recharges' });

Transaction.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
User.hasMany(Transaction, { foreignKey: 'created_by', as: 'transactions' });

ActivityLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(ActivityLog, { foreignKey: 'user_id', as: 'activityLogs' });

// Initialize Complaint associations
const models = {
  User,
  Customer,
  Connection,
  Recharge,
  Stock,
  Transaction,
  ActivityLog,
  Complaint,
  Area
};
if (Complaint.associate) {
  Complaint.associate(models);
  if (Area.associate) Area.associate(models);
}

module.exports = {
  sequelize,
  User,
  Customer,
  Connection,
  Recharge,
  Stock,
  Transaction,
  ActivityLog,
  Complaint,
  Area
};
