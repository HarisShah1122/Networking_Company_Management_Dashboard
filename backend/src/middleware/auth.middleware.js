const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { JWT_SECRET } = require('../config/env');

const authenticate = async (req, res, next) => {
  try {
    console.log('🔐 JWT Auth - Checking Authorization header');
    
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('❌ No Bearer token found in Authorization header');
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    console.log('🔑 JWT token extracted:', token.substring(0, 20) + '...');
    
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ JWT token verified for user:', decoded.userId);

    const user = await User.findByPk(decoded.userId);
    if (!user) {
      console.log('❌ User not found for JWT token');
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    req.companyId = decoded.companyId;
    console.log('✅ JWT authentication successful for user:', user.username);
    return next();
    
  } catch (err) {
    console.error('❌ JWT Auth error:', err.message);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

module.exports = { authenticate };