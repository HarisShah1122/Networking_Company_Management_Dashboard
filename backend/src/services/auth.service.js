const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
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

    // Validate password exists
    if (!password || password.trim() === '') {
      throw new Error('Password is required');
    }

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

    // Hash password explicitly before creating user
    const password_hash = await bcrypt.hash(password, 10);
    
    // Ensure password_hash is set
    if (!password_hash) {
      throw new Error('Failed to hash password');
    }

    // For public registration, default to 'Staff' role if not provided or if role is not allowed
    const allowedRoles = ['CEO', 'Manager', 'Staff'];
    const userRole = role && allowedRoles.includes(role) ? role : 'Staff';
    
    // Create user with password_hash (don't pass password field)
    const user = await UserService.create({ 
      email, 
      username, 
      password_hash, // Use password_hash directly instead of password
      role: userRole,
      status: 'active' // Explicitly set status
    });
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

