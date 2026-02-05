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
    assignedTo: { type: DataTypes.UUID, allowNull: true, field: 'assigned_to' },
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
    longitude: { type: DataTypes.DECIMAL(11, 8), allowNull: true },
    // SLA tracking fields
    assigned_at: { type: DataTypes.DATE, allowNull: true, field: 'assigned_at' },
    sla_deadline: { type: DataTypes.DATE, allowNull: true, field: 'sla_deadline' },
    sla_status: { 
      type: DataTypes.ENUM('pending', 'met', 'breached', 'pending_penalty'), 
      defaultValue: 'pending', 
      field: 'sla_status' 
    },
    penalty_applied: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'penalty_applied' },
    penalty_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0, field: 'penalty_amount' },
    penalty_applied_at: { type: DataTypes.DATE, allowNull: true, field: 'penalty_applied_at' }
  }, {
    tableName: 'complaints',
    timestamps: true,
    underscored: true
  });

  Complaint.associate = (models) => {
    Complaint.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
    Complaint.belongsTo(models.Connection, { foreignKey: 'connectionId', as: 'connection' });
    Complaint.belongsTo(models.User, { as: 'assignee', foreignKey: 'assignedTo' });
    Complaint.belongsTo(models.Area, { foreignKey: 'company_id', as: 'companyArea' });
  };

  return Complaint;
};
