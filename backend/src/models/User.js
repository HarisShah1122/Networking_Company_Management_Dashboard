const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true, validate: { isEmail: true } },
    username: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    phone: { type: DataTypes.STRING(20), allowNull: true },
    password: {
      type: DataTypes.VIRTUAL,
      set(value) { this.setDataValue('password', value); }
    },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    role: { type: DataTypes.ENUM('SuperAdmin', 'CEO', 'Manager', 'Staff', 'Technician'), defaultValue: 'Staff' },
    status: { type: DataTypes.ENUM('active', 'inactive'), defaultValue: 'active' },
    companyId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'company_id'
    }
  }, {
    tableName: 'users',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeCreate: async (user) => {
        if (!user.password_hash && user.password) user.password_hash = await bcrypt.hash(user.password, 10);
      },
      beforeUpdate: async (user) => {
        if (user.changed('password') && user.password) user.password_hash = await bcrypt.hash(user.password, 10);
      }
    }
  });

  User.prototype.comparePassword = async function(plainPassword) {
    return bcrypt.compare(plainPassword, this.password_hash);
  };

  User.findByEmail = async function(email) {
    return this.findOne({ where: { email } });
  };

  User.findByUsername = async function(username) {
    return this.findOne({ where: { username } });
  };

  User.associate = (models) => {
    User.belongsTo(models.Area, { foreignKey: 'companyId', as: 'area' });
    User.hasMany(models.Complaint, { foreignKey: 'assignedTo', as: 'assignedComplaints' });
  };

  return User;
};
