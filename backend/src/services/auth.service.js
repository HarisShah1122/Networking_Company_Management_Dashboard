const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, Company } = require('../models');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');

const generateToken = (user) =>
  jwt.sign(
    {
      userId: user.id,
      role: user.role,
      companyId: user.companyId
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

const login = async (username, password) => {
  const user = await User.findOne({ where: { username } });
  if (!user) throw new Error('Invalid credentials');

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) throw new Error('Invalid credentials');

  if (user.status !== 'active')
    throw new Error('Account is inactive');

  const token = generateToken(user);

  const company = user.companyId
    ? await Company.findByPk(user.companyId)
    : null;

  return { token, user, company };
};

const register = async ({ username, email, password, companyName }) => {
  const exists = await User.findOne({ where: { username } });
  if (exists) throw new Error('Username already exists');

  const password_hash = await bcrypt.hash(password, 10);

  const user = await User.create({
    username,
    email,
    password_hash,
    role: 'CEO',
    status: 'active'
  });

  let company = null;

  if (companyName) {
    company = await Company.create({
      name: companyName,
      email: email,
      company_id: `ISP-${Date.now()}`,
      status: 'active'
    });

    await user.update({ companyId: company.id });
  }

  const token = generateToken(user);
  return { token, user, company };
};

module.exports = { login, register };
