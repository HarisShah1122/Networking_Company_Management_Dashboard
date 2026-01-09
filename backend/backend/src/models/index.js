const sequelize = require('../config/database');

// Import models
const User = require('./User')(sequelize);
const Customer = require('./Customer')(sequelize);
const Connection = require('./Connection')(sequelize);
const Recharge = require('./Recharge')(sequelize);
const Stock = require('./Stock')(sequelize);
const Transaction = require('./Transaction')(sequelize);
const ActivityLog = require('./ActivityLog')(sequelize);

// Define associations
Connection.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
Customer.hasMany(Connection, { foreignKey: 'customer_id', as: 'connections' });

Recharge.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
Customer.hasMany(Recharge, { foreignKey: 'customer_id', as: 'recharges' });

Transaction.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
User.hasMany(Transaction, { foreignKey: 'created_by', as: 'transactions' });

ActivityLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(ActivityLog, { foreignKey: 'user_id', as: 'activityLogs' });

module.exports = {
  sequelize,
  User,
  Customer,
  Connection,
  Recharge,
  Stock,
  Transaction,
  ActivityLog
};

