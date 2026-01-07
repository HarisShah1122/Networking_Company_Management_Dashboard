const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    username: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.VIRTUAL,
      set(value) {
        this.setDataValue('password', value);
      }
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('CEO', 'Manager', 'Staff'),
      defaultValue: 'Staff'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active'
    }
  }, {
    tableName: 'users',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeCreate: async (user) => {
        // If password_hash is already provided, use it
        if (user.password_hash) {
          return; // Skip hashing if password_hash is already set
        }
        // Otherwise, hash the password if provided
        if (user.password) {
          user.password_hash = await bcrypt.hash(user.password, 10);
        }
        // Ensure password_hash is set (validation requirement)
        if (!user.password_hash) {
          throw new Error('Password hash is required');
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password') && user.password) {
          user.password_hash = await bcrypt.hash(user.password, 10);
        }
      }
    }
  });

  // Instance methods
  User.prototype.comparePassword = async function(plainPassword) {
    return bcrypt.compare(plainPassword, this.password_hash);
  };

  // Class methods
  User.findByEmail = async function(email) {
    return this.findOne({ where: { email } });
  };

  User.findByUsername = async function(username) {
    return this.findOne({ where: { username } });
  };

  return User;
};
