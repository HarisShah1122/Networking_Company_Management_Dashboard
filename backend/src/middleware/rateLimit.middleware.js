const rateLimit = require('express-rate-limit');


const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,   
  max: 8,                     
  message: {
    error: 'Too many login attempts. Please try again later.'
  },
  standardHeaders: true,        
  legacyHeaders: false,         
  statusCode: 429,            

  handler: (req, res, next, options) => {
    res.status(options.statusCode).json({
      error: options.message.error || 'Too many login attempts from this IP. Try again in 5 minutes.'
    });
  }
});

module.exports = { loginLimiter };