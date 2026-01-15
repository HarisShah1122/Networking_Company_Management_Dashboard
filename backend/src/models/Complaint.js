const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Complaint = sequelize.define('Complaint', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    customerId: { type: DataTypes.UUID, allowNull: true, field: 'customer_id' },
    connectionId: { type: DataTypes.UUID, allowNull: true, field: 'connection_id' },
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    status: { type: DataTypes.ENUM('open','in_progress','on_hold','closed'), defaultValue: 'open' },
    priority: { type: DataTypes.ENUM('low','medium','high','urgent'), defaultValue: 'medium' },
    assignedTo: { type: DataTypes.UUID, allowNull: true },
    name: { type: DataTypes.STRING(255), allowNull: true },
    address: { type: DataTypes.TEXT, allowNull: true },
    whatsapp_number: { type: DataTypes.STRING(20), allowNull: true }
  }, {
    tableName: 'complaints',
    timestamps: true,
    underscored: true
  });

  Complaint.associate = (models) => {
    Complaint.belongsTo(models.Customer, { foreignKey: 'customerId', constraints: false });
    Complaint.belongsTo(models.Connection, { foreignKey: 'connectionId', constraints: false });
    Complaint.belongsTo(models.User, { as: 'Assignee', foreignKey: 'assignedTo', constraints: false });
  };

  return Complaint;
};
