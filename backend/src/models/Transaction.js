const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Transaction = sequelize.define('Transaction', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    type: { type: DataTypes.ENUM('income','expense'), allowNull: false },
    amount: { type: DataTypes.DECIMAL(10,2), allowNull: false, validate: { min: 0.01 } },
    description: { type: DataTypes.TEXT, allowNull: true },
    category: { type: DataTypes.STRING(100), allowNull: true },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    created_by: { type: DataTypes.UUID, allowNull: true }
  }, {
    tableName: 'transactions',
    timestamps: true,
    underscored: true
  });

  return Transaction;
};
