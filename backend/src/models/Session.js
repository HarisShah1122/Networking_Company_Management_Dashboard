module.exports = (sequelize, DataTypes) => {
  const Session = sequelize.define('Session', {
    sid: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    data: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    expires: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    tableName: 'Sessions',
    timestamps: true,
    updatedAt: false,
    indexes: [
      {
        unique: true,
        fields: ['sid']
      },
      {
        fields: ['userId']
      },
      {
        fields: ['expires']
      }
    ]
  });

  return Session;
};
