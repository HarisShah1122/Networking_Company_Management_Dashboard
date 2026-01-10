const { Op } = require('sequelize');
const { User } = require('../models');

class UserService {
  static async getAll() {
    return await User.findAll({
      attributes: ['id', 'email', 'username', 'role', 'status', 'created_at'],
      order: [['created_at', 'DESC']]
    });
  }

  static async getById(id) {
    return await User.findByPk(id, {
      attributes: ['id', 'email', 'username', 'role', 'status', 'created_at']
    });
  }

  static async getByEmail(email) {
    return await User.findByEmail(email);
  }

  static async getByUsername(username) {
    return await User.findByUsername(username);
  }

  static async create(data) {
    // If password_hash is provided, use build and setDataValue to ensure it's set correctly
    if (data.password_hash) {
      const user = User.build(data);
      user.setDataValue('password_hash', data.password_hash); // Explicitly set password_hash
      await user.save();
      return user;
    }
    return await User.create(data);
  }
 
  static async update(id, data) {
    const user = await User.findByPk(id);
    if (!user) return null;

    await user.update(data);
    return await this.getById(id);
  }

  static async emailExists(email, excludeId = null) {
    const where = { email };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }
    
    const user = await User.findOne({ where });
    return !!user;
  }

  static async usernameExists(username, excludeId = null) {
    const where = { username };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }
    
    const user = await User.findOne({ where });
    return !!user;
  }

  static async delete(id) {
    try {
      const user = await User.findByPk(id);
      if (!user) return false;
      await user.destroy();
      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = UserService;

