const { User } = require('../models');
const authenticate = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  req.user = {
    id: req.session.user.userId,
    role: req.session.user.role,
    companyId: req.session.user.companyId,
  };
  next();
};
module.exports = { authenticate };