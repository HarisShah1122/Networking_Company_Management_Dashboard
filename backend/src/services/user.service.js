const { Op, Sequelize } = require('sequelize');
const bcrypt = require('bcrypt');
const { User } = require('../models');

const getAll = async (companyId) => {
  const whereClause = companyId ? { company_id: companyId } : {};
  return await User.findAll({
    where: whereClause,
    attributes: ['id', 'email', 'username', 'role', 'status', 'created_at'],
    order: [['created_at', 'DESC']]
  });
};

const getById = async (id, companyId) => {
  return await User.findByPk(id, {
    where: { company_id: companyId },
    attributes: ['id', 'email', 'username', 'role', 'status', 'created_at']
  });
};

const getByEmail = async (email, companyId) => {
  return await User.findOne({ 
    where: { 
      email, 
      company_id: companyId 
    } 
  });
};

const getByUsername = async (username, companyId) => {
  // Case-insensitive username lookup
  return await User.findOne({ 
    where: Sequelize.where(
      Sequelize.fn('LOWER', Sequelize.col('username')), 
      username.toLowerCase()
    ),
    company_id: companyId
  });
};

const create = async (data, companyId) => {
  // Accept either password (plain text) or password_hash
  let password_hash = data.password_hash;
  
  if (!password_hash && data.password) {
    // If password is provided, hash it
    password_hash = await bcrypt.hash(data.password, 10);
  }
  
  if (!password_hash) {
    throw new Error('Password is required for new user');
  }

  return await User.create({
    email: data.email?.trim(),
    username: data.username?.trim(),
    password_hash,
    role: data.role || 'Staff',
    status: data.status || 'active',
    company_id: companyId
  });
};

const update = async (id, data, companyId) => {
  const user = await User.findByPk(id);
  if (!user) return null;
  
  // Verify the user belongs to the specified company
  if (user.company_id !== companyId) {
    return null;
  }

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
    user.password_hash = await bcrypt.hash(data.password.trim(), 10);
    fields.push('password_hash');
  }

  if (fields.length > 0) {
    await user.save({ fields });
  }
  
  return await getById(id, companyId);
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
