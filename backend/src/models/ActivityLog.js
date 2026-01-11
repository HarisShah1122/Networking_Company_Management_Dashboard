module.exports = (sequelize, DataTypes) => {
  const ActivityLog = sequelize.define('ActivityLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    model: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'activity_logs',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['created_at'] },
      { fields: ['user_id', 'created_at'] },
      { fields: ['model', 'created_at'] }
    ]
  });

  ActivityLog.associate = (models) => {
    ActivityLog.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return ActivityLog;
};
