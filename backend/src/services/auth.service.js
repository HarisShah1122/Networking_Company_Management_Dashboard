const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');
const { User, Company } = require('../models');

const generateToken = (userId) => jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

const login = async (username, password) => {
  const user = await User.findOne({ where: { username } });
  if (!user) throw new Error('Invalid credentials');

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) throw new Error('Invalid credentials');
  if (user.status !== 'active') throw new Error('Account is inactive');

  const token = generateToken(user.id);

  const company = user.companyId ? await Company.findByPk(user.companyId) : null;

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      companyId: user.companyId,
    },
    company: company
      ? { id: company.id, company_id: company.company_id, name: company.name }
      : null,
  };
};

const register = async ({ username, email, password, companyName }) => {
  const existingUser = await User.findOne({ where: { username } });
  if (existingUser) throw new Error('Username already exists');

  const password_hash = await bcrypt.hash(password, 10);
  const user = await User.create({ username, email, password_hash, role: 'CEO', status: 'active' });

  let company = null;
  if (companyName) {
    const company_id = `ISP-${Math.floor(100000000 + Math.random() * 900000000)}`;
    company = await Company.create({ name: companyName, company_id, status: 'active' });
    await user.update({ companyId: company.id });
  }

  const token = generateToken(user.id);
  return { token, user, company };
};

module.exports = { login, register };
