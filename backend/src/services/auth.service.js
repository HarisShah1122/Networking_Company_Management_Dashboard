const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');
const userService = require('./user.service');

const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
};

const login = async (username, password) => {
  const user = await userService.getByUsername(username);

  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    throw new Error('Invalid credentials');
  }

  if (user.status !== 'active') {
    throw new Error('Account is inactive');
  }

  const token = generateToken(user.id);

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role
    }
  };
};

const register = async ({ email, username, password, role }) => {
  const existingUsername = await userService.getByUsername(username);
  if (existingUsername) {
    throw new Error('Username already exists');
  }

  const password_hash = await bcrypt.hash(password, 10);

  const user = await userService.create({
    email,
    username,
    password_hash,
    role: role || 'Staff',
    status: 'active'
  });

  const token = generateToken(user.id);

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role
    }
  };
};

module.exports = {
  login,
  register
};
