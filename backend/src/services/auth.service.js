const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');
const UserService = require('./user.service');
const ActivityLogService = require('./activityLog.service');
const { MESSAGES } = require('../helpers/constants');

class AuthService {
  static generateToken(userId) {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  static async login(email, password) {
    const user = await UserService.getByEmail(email);
    
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

    const token = this.generateToken(user.id);

    // Log activity (non-blocking)
    ActivityLogService.logActivity(user.id, 'login', 'auth', 'User logged in');

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role
      }
    };
  }

  static async register(userData) {
    const { email, username, password, role } = userData;

    // Check if email exists
    const existingEmail = await UserService.getByEmail(email);
    if (existingEmail) {
      throw new Error('Email already exists');
    }

    // Check if username exists
    const existingUsername = await UserService.getByUsername(username);
    if (existingUsername) {
      throw new Error('Username already exists');
    }

    const user = await UserService.create({ email, username, password, role });
    const token = this.generateToken(user.id);

    // Log activity (non-blocking)
    ActivityLogService.logActivity(user.id, 'register', 'auth', `New user registered: ${user.username}`);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role
      }
    };
  }
}

module.exports = AuthService;

