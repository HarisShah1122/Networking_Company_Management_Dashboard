module.exports = (sequelize, DataTypes) => {
  const PackageRenewal = sequelize.define('PackageRenewal', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    connectionId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    previousPackage: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    newPackage: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    renewalDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    expiryDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    amountPaid: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    renewedBy: {
      type: DataTypes.UUID,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed'),
      defaultValue: 'completed'
    }
  }, {
    tableName: 'package_renewals',
    timestamps: true,
    underscored: true
  });

  // PackageRenewal.associate = (models) => {
  //   PackageRenewal.belongsTo(models.Connection, { foreignKey: 'connectionId' });
  //   PackageRenewal.belongsTo(models.User, { as: 'Renewer', foreignKey: 'renewedBy' });
  // };

  return PackageRenewal;
};