const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { JWT_SECRET } = require('../config/env');

const authenticate = async (req, res, next) => {
  try {
    console.log(' Auth Middleware - Checking both JWT and Session');
    
    // First try JWT authentication
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      console.log(' JWT token found, attempting verification...');
      
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log(' JWT token verified for user:', decoded.userId);

        const user = await User.findByPk(decoded.userId);
        if (!user) {
          console.log(' User not found for JWT token');
          return res.status(401).json({ error: 'User not found' });
        }

        req.user = user;
        req.companyId = decoded.companyId;
        req.authMethod = 'jwt';
        console.log(' JWT authentication successful for user:', user.username);
        return next();
      } catch (jwtError) {
        console.warn(' JWT token invalid, trying session auth:', jwtError.message);
        // Fall through to session authentication
      }
    }

    // Fallback to session-based authentication
    if (req.session?.user) {
      console.log(' Session found, attempting verification...');
      
      const user = await User.findByPk(req.session.user.userId);
      if (!user) {
        console.log(' User not found for session');
        return res.status(401).json({ error: 'User not found' });
      }

      req.user = user;
      req.companyId = req.session.user.companyId;
      req.authMethod = 'session';
      console.log(' Session authentication successful for user:', user.username);
      return next();
    }

    // Neither JWT nor session worked
    console.log(' No valid authentication found - neither JWT nor session');
    return res.status(401).json({ 
      error: 'Not authenticated',
      message: 'Please provide a valid JWT token or active session'
    });
    
  } catch (err) {
    console.error(' Auth middleware error:', err.message);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

module.exports = { authenticate };