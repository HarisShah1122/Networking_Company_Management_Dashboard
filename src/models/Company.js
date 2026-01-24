const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Company = sequelize.define('Company', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    company_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      defaultValue: 'active'
    }
  }, {
    tableName: 'companies',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['company_id'],
        name: 'company_id'
      },
      {
        unique: true,
        fields: ['email'],
        name: 'email'
      }
    ]
  });

  Company.associate = (models) => {
    Company.hasMany(models.User, { foreignKey: 'companyId', as: 'users' });
  };

  return Company;
};

