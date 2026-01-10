const { Op } = require('sequelize');
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
  if (data.password_hash) {
    const user = User.build(data);
    user.setDataValue('password_hash', data.password_hash);
    await user.save();
    return user;
  }
  return await User.create(data);
};

const update = async (id, data) => {
  const user = await User.findByPk(id);
  if (!user) return null;

  await user.update(data);
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
