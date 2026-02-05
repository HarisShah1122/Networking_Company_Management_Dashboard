const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { JWT_SECRET } = require('../config/env');

const authenticate = async (req, res, next) => {
  try {
    // First try JWT authentication
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      
      try {
        const decoded = jwt.verify(token, JWT_SECRET);

        const user = await User.findByPk(decoded.userId);
        if (!user) {
          return res.status(401).json({ error: 'User not found' });
        }

        req.user = user;
        req.companyId = decoded.companyId || user.company_id;
        req.authMethod = 'jwt';
        return next();
      } catch (jwtError) {
        // Fall through to session authentication
      }
    }

    // Fallback to session-based authentication
    if (req.session?.user) {
      const user = await User.findByPk(req.session.user.userId);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      req.user = user;
      req.companyId = req.session.user.companyId || user.company_id;
      req.authMethod = 'session';
      return next();
    }

    // Neither JWT nor session worked
    return res.status(401).json({ 
      error: 'Not authenticated',
      message: 'Please provide a valid JWT token or active session'
    });
    
  } catch (err) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

module.exports = { authenticate };