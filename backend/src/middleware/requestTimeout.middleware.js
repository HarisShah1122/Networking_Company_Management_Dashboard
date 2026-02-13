const requestTimeout = (timeout = 30000) => {
  return (req, res, next) => {
    const startTime = Date.now();
    
    // Set timeout for the entire request
    const timeoutId = setTimeout(() => {
      const duration = Date.now() - startTime;
      console.error(`⏰ Request timeout for ${req.method} ${req.url} after ${duration}ms`);
      
      if (!res.headersSent) {
        res.status(504).json({
          success: false,
          message: 'Request timeout. The operation took too long to complete.',
          code: 'REQUEST_TIMEOUT',
          duration: `${duration}ms`,
          technicalDetails: 'The server encountered a timeout while processing your request.',
          userMessage: 'Server error. Please try again later.'
        });
      }
    }, timeout);

    // Clear timeout when response finishes
    res.on('finish', () => {
      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;
      
      // Log slow requests for monitoring
      if (duration > 5000) {
        console.warn(`⚠️ Slow request: ${req.method} ${req.url} took ${duration}ms`);
      } else {
        console.log(`✅ Request completed: ${req.method} ${req.url} in ${duration}ms`);
      }
    });

    // Clear timeout on error
    res.on('error', () => {
      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;
      console.error(`❌ Request error: ${req.method} ${req.url} after ${duration}ms`);
    });

    // Handle client disconnect
    req.on('close', () => {
      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;
      console.log(`🔌 Client disconnected: ${req.method} ${req.url} after ${duration}ms`);
    });

    next();
  };
};

module.exports = requestTimeout;
