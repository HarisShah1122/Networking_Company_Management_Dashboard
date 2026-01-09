const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Recharge = sequelize.define('Recharge', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    customer_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'customers',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0.01
      }
    },
    payment_method: {
      type: DataTypes.ENUM('cash', 'card', 'online', 'bank_transfer'),
      defaultValue: 'cash'
    },
    due_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'paid', 'overdue'),
      defaultValue: 'pending'
    },
    payment_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'recharges',
    timestamps: true,
    underscored: true
  });

  return Recharge;
};
