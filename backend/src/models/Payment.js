module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define('Payment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    customer_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'customers', key: 'id' }
    },
    company_id: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'company_id'
    },
    connection_id: { type: DataTypes.UUID, allowNull: true },
    recharge_id:   { type: DataTypes.UUID, allowNull: true },
    amount:        { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    payment_method: {
      type: DataTypes.ENUM('cash', 'bank_transfer', 'mobile_wallet', 'card'),
      defaultValue: 'cash'
    },
    reference_number: { type: DataTypes.STRING(100), allowNull: true },
    received_by:      { type: DataTypes.UUID, allowNull: false },
    trx_id:           { type: DataTypes.STRING(100), allowNull: false, unique: true },
    receipt_image:    { type: DataTypes.STRING, allowNull: true },
    notes:            { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM('pending', 'paid', 'completed', 'confirmed', 'approved', 'unpaid'),
      defaultValue: 'pending'
    }
  }, {
    tableName: 'payments',
    timestamps: true,
    underscored: true
  });

  Payment.associate = (models) => {
    Payment.belongsTo(models.Customer, { foreignKey: 'customer_id', as: 'customer' });
    Payment.belongsTo(models.Connection, { foreignKey: 'connection_id', as: 'connection' });
    Payment.belongsTo(models.Recharge,   { foreignKey: 'recharge_id',   as: 'recharge'   });
    Payment.belongsTo(models.User,       { foreignKey: 'received_by',   as: 'receiver'   });
  };

  return Payment;
};