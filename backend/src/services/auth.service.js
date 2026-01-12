const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');
const userService = require('./user.service');
const activityLogService = require('./activityLog.service');
const { MESSAGES } = require('../helpers/constants');

const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

const login = async (email, password) => {
  const user = await userService.getByEmail(email);
  
  if (!user) {
    throw new Error(MESSAGES.INVALID_CREDENTIALS);
  }

  const isValidPassword = await user.comparePassword(password);
  if (!isValidPassword) {
    throw new Error(MESSAGES.INVALID_CREDENTIALS);
  }

  if (user.status !== 'active') {
    throw new Error(MESSAGES.ACCOUNT_INACTIVE);
  }

  const token = generateToken(user.id);

  activityLogService.logActivity(user.id, 'login', 'auth', 'User logged in');

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role
    }
  };
};

const register = async (userData) => {
  const { email, username, password, role } = userData;

  // Let express-validator handle empty/missing password
  // We only do minimal sanitization here

  const trimmedPassword = String(password || '').trim();
  if (!trimmedPassword) {
    throw new Error('Password is required');
  }

  const existingEmail = await userService.getByEmail(email);
  if (existingEmail) {
    throw new Error('Email already exists');
  }

  const existingUsername = await userService.getByUsername(username);
  if (existingUsername) {
    throw new Error('Username already exists');
  }

  const password_hash = await bcrypt.hash(trimmedPassword, 10);

  const allowedRoles = ['CEO', 'Manager', 'Staff'];
  const userRole = role && allowedRoles.includes(role) ? role : 'Staff';

  const user = await userService.create({ 
    email, 
    username, 
    password: trimmedPassword,   // ← pass plain password here
    role: userRole,
    status: 'active'
  });

  const token = generateToken(user.id);

  activityLogService.logActivity(user.id, 'register', 'auth', `New user registered: ${user.username}`);

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role
    }
  };
};

module.exports = {
  generateToken,
  login,
  register
};