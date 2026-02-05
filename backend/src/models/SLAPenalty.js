const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SLAPenalty = sequelize.define('SLAPenalty', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    complaintId: { type: DataTypes.UUID, allowNull: false, field: 'complaint_id' },
    technicianId: { type: DataTypes.UUID, allowNull: false, field: 'technician_id' },
    companyId: { type: DataTypes.UUID, allowNull: false, field: 'company_id' },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    reason: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'SLA Breach - 24 hour deadline exceeded' },
    status: { 
      type: DataTypes.ENUM('pending', 'applied', 'waived'), 
      defaultValue: 'pending' 
    },
    applied_at: { type: DataTypes.DATE, allowNull: true, field: 'applied_at' },
    waived_at: { type: DataTypes.DATE, allowNull: true, field: 'waived_at' },
    waived_by: { type: DataTypes.UUID, allowNull: true, field: 'waived_by' },
    waived_reason: { type: DataTypes.TEXT, allowNull: true, field: 'waived_reason' },
    // SLA breach details
    assigned_at: { type: DataTypes.DATE, allowNull: false, field: 'assigned_at' },
    sla_deadline: { type: DataTypes.DATE, allowNull: false, field: 'sla_deadline' },
    breach_duration_hours: { type: DataTypes.DECIMAL(5, 2), allowNull: true, field: 'breach_duration_hours' }
  }, {
    tableName: 'sla_penalties',
    timestamps: true,
    underscored: true
  });

  return SLAPenalty;
};
