const { Op } = require('sequelize');
const bcrypt = require('bcrypt');
const { User } = require('../models');

const getAll = async () => {
  return await User.findAll({
    attributes: ['id', 'email', 'username', 'role', 'status', 'created_at'],
    order: [['created_at', 'DESC']]
  });
};

const getById = async (id) => {
  return await User.findByPk(id, {
    attributes: ['id', 'email', 'username', 'role', 'status', 'created_at']
  });
};

const getByEmail = async (email) => {
  return await User.findByEmail(email);
};

const getByUsername = async (username) => {
  return await User.findByUsername(username);
};

const create = async (data) => {
  if (!data.password) {
    throw new Error('Password is required');
  }
  const password_hash = await bcrypt.hash(data.password, 10);
  return await User.create({
    email: data.email,
    username: data.username,
    password_hash,
    role: data.role || 'Staff',
    status: data.status || 'active'
  });
};

const update = async (id, data) => {
  const user = await User.findByPk(id);
  if (!user) return null;

  const fields = [];
  
  if (data.email !== undefined) {
    user.email = data.email;
    fields.push('email');
  }
  if (data.username !== undefined) {
    user.username = data.username;
    fields.push('username');
  }
  if (data.role !== undefined) {
    user.role = data.role;
    fields.push('role');
  }
  if (data.status !== undefined) {
    user.status = data.status;
    fields.push('status');
  }
  if (data.password && data.password.trim()) {
    user.password = data.password.trim();
    fields.push('password');
  }

  if (fields.length > 0) {
    await user.save({ fields });
  }
  
  return await getById(id);
};

const emailExists = async (email, excludeId = null) => {
  const where = { email };
  if (excludeId) {
    where.id = { [Op.ne]: excludeId };
  }
  
  const user = await User.findOne({ where });
  return !!user;
};

const usernameExists = async (username, excludeId = null) => {
  const where = { username };
  if (excludeId) {
    where.id = { [Op.ne]: excludeId };
  }
  
  const user = await User.findOne({ where });
  return !!user;
};

const deleteUser = async (id) => {
  try {
    const user = await User.findByPk(id);
    if (!user) return false;
    await user.destroy();
    return true;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getAll,
  getById,
  getByEmail,
  getByUsername,
  create,
  update,
  emailExists,
  usernameExists,
  delete: deleteUser
};
