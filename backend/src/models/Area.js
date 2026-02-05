const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Area = sequelize.define('Area', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    company_id: {
      type: DataTypes.UUID,
      allowNull: false
    }
  }, {
    tableName: 'areas',
    timestamps: true,
    underscored: true
  });

  Area.associate = (models) => {
    Area.hasMany(models.Customer, { foreignKey: 'area_id' });
  };

  return Area;
};
