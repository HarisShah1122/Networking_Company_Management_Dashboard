const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Connection = sequelize.define('Connection', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    customer_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'customers', key: 'id' }, onDelete: 'CASCADE' },
    connection_type: { type: DataTypes.STRING(100), allowNull: false },
    installation_date: { type: DataTypes.DATEONLY, allowNull: true },
    activation_date: { type: DataTypes.DATEONLY, allowNull: true },
    status: { type: DataTypes.ENUM('pending', 'completed', 'cancelled'), defaultValue: 'pending' },
    notes: { type: DataTypes.TEXT, allowNull: true }
  }, {
    tableName: 'connections',
    timestamps: true,
    underscored: true
  });

  return Connection;
};
