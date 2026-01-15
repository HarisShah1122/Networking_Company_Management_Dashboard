const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');
const userService = require('./user.service');

const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
};

const login = async (username, password, role, companyId) => {
  const { Company } = require('../models');
  
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

  // If role is provided, verify it matches
  if (role && user.role !== role) {
    throw new Error('Invalid role selected');
  }

  // If companyId is provided, verify it matches user's company
  // If not provided but user has a company, use user's company
  let finalCompanyId = companyId;
  if (!finalCompanyId && user.companyId) {
    // User has a company in database, use it
    finalCompanyId = user.companyId;
  } else if (finalCompanyId && user.companyId) {
    // Both provided - must match
    if (user.companyId !== companyId) {
      throw new Error('Invalid company selected');
    }
  } else if (finalCompanyId && !user.companyId) {
    // Company provided but user doesn't have one - this is OK for now
    // (might be a new user registration scenario)
  }

  // Load company info if user has a company
  let company = null;
  const userCompanyId = finalCompanyId || user.companyId;
  if (userCompanyId) {
    company = await Company.findByPk(userCompanyId);
  }

  const token = generateToken(user.id);

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      companyId: userCompanyId
    },
    company: company ? {
      id: company.id,
      company_id: company.company_id,
      name: company.name
    } : null
  };
};

const register = async ({ email, username, password, companyName }) => {
  const { Company } = require('../models');
  
  // Check if email already exists (for company)
  const existingCompany = await Company.findOne({ where: { email } });
  if (existingCompany) {
    throw new Error('Email already registered for a company');
  }

  const existingUsername = await userService.getByUsername(username);
  if (existingUsername) {
    throw new Error('Username already exists');
  }

  // Validate password
  if (!password || password.length < 6) {
    throw new Error('Password is required and must be at least 6 characters');
  }

  // Generate company_id
  const randomId = Math.floor(100000000 + Math.random() * 900000000);
  const company_id = `ISP-${randomId}`;

  // Create company
  const company = await Company.create({
    company_id,
    name: companyName,
    email,
    status: 'active'
  });

  // Hash password
  const password_hash = await bcrypt.hash(password, 10);

  // Create user (CEO role for company registration)
  const user = await userService.create({
    email,
    username,
    password_hash,
    role: 'CEO',
    status: 'active',
    companyId: company.id
  });

  const token = generateToken(user.id);

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      companyId: user.companyId
    },
    company: {
      id: company.id,
      company_id: company.company_id,
      name: company.name
    }
  };
};

module.exports = {
  login,
  register
};
