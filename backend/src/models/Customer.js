const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Customer = sequelize.define('Customer', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: { isEmail: true }
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    father_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    gender: {
      type: DataTypes.ENUM('male', 'female', 'other'),
      allowNull: true
    },
    whatsapp_number: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    pace_user_id: {          // ← NEW FIELD
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true
    },
    areaId: {                // ← NEW FOREIGN KEY
      type: DataTypes.UUID,
      allowNull: true,
      field: 'area_id'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      defaultValue: 'active'
    }
  }, {
    tableName: 'customers',
    timestamps: true,
    underscored: true
  });

  Customer.associate = (models) => {
    Customer.belongsTo(models.Area, { foreignKey: 'areaId' });
  
  };

  return Customer;
};