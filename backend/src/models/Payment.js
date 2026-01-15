module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define('Payment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    connectionId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    rechargeId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    paymentMethod: {
      type: DataTypes.ENUM('cash', 'bank_transfer', 'mobile_wallet', 'card'),
      defaultValue: 'cash'
    },
    referenceNumber: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    receivedBy: {
      type: DataTypes.UUID,
      allowNull: false
    },
    trxId: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    receiptImage: {
      type: DataTypes.STRING,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'payments',
    timestamps: true,
    underscored: true
  });

  Payment.associate = (models) => {
    Payment.belongsTo(models.Customer, { foreignKey: 'customerId' });
    Payment.belongsTo(models.Connection, { foreignKey: 'connectionId' });
    Payment.belongsTo(models.Recharge, { foreignKey: 'rechargeId' });
    Payment.belongsTo(models.User, { as: 'Receiver', foreignKey: 'receivedBy' });
  };

  return Payment;
};
