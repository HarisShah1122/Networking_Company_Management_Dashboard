const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Transaction = sequelize.define('Transaction', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    type: {
      type: DataTypes.ENUM('income', 'expense'),
      allowNull: false,
    },

    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    company_id: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'company_id'
    },

    trx_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'trx_id'
    },

    category: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    receiptImage: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'receiptImage'
    },

    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  }, {
    tableName: 'transactions',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    underscored: false,
  });

  return Transaction;
};
