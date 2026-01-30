const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { JWT_SECRET } = require('../config/env');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);

      const user = await User.findByPk(decoded.userId);
      if (!user) return res.status(401).json({ error: 'User not found' });

      req.user = user;
      req.companyId = decoded.companyId;
      return next();
    }

    // Session-based authentication
    if (req.session?.user) {
      const user = await User.findByPk(req.session.user.userId);
      if (!user) return res.status(401).json({ error: 'User not found' });

      req.user = user;
      req.companyId = req.session.user.companyId;
      return next();
    }

    return res.status(401).json({ error: 'Not authenticated' });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = { authenticate };