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
    whatsapp_number: { type: DataTypes.STRING(20), allowNull: true },
    company_id: { type: DataTypes.UUID, allowNull: true, field: 'company_id' },
    // External source tracking
    external_source: { type: DataTypes.STRING(50), allowNull: true, field: 'external_source' },
    external_id: { type: DataTypes.STRING(100), allowNull: true, field: 'external_id' },
    source_type: { type: DataTypes.ENUM('internal', 'external'), defaultValue: 'internal', field: 'source_type' },
    // Location fields
    area: { type: DataTypes.STRING(255), allowNull: true },
    district: { type: DataTypes.STRING(100), allowNull: true },
    city: { type: DataTypes.STRING(100), allowNull: true },
    province: { type: DataTypes.STRING(100), allowNull: true },
    postal_code: { type: DataTypes.STRING(20), allowNull: true },
    landmark: { type: DataTypes.STRING(255), allowNull: true },
    latitude: { type: DataTypes.DECIMAL(10, 8), allowNull: true },
    longitude: { type: DataTypes.DECIMAL(11, 8), allowNull: true }
  }, {
    tableName: 'complaints',
    timestamps: true,
    underscored: true
  });

  // Complaint.associate = (models) => {
  //   Complaint.belongsTo(models.Customer, { foreignKey: 'customerId', constraints: false });
  //   Complaint.belongsTo(models.Connection, { foreignKey: 'connectionId', constraints: false });
  //   Complaint.belongsTo(models.User, { as: 'Assignee', foreignKey: 'assignedTo', constraints: false });
  // };

  return Complaint;
};
