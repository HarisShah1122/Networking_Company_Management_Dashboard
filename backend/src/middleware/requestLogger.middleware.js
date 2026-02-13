const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Add request ID to response headers for tracking
  res.setHeader('X-Request-ID', requestId);
  
  // Log request details
  console.log(`🌐 === INCOMING REQUEST [${requestId}] ===`);
  console.log('📍 Method:', req.method);
  console.log('🔗 URL:', req.url);
  console.log('👤 User:', req.user?.id || 'Anonymous');
  console.log('🏢 Company:', req.companyId || 'None');
  console.log('📱 User-Agent:', req.get('User-Agent'));
  console.log('🌐 Origin:', req.get('Origin'));
  console.log('📊 Content-Length:', req.get('Content-Length'));
  console.log('==========================================');
  
  // Override res.end to log response
  const originalEnd = res.end;
  const originalJson = res.json;
  
  res.end = function(chunk, encoding) {
    const duration = Date.now() - startTime;
    console.log(`\n📤 === RESPONSE [${requestId}] ===`);
    console.log('📊 Status Code:', res.statusCode);
    console.log('⏱️ Duration:', duration + 'ms');
    console.log('📏 Response Size:', chunk ? chunk.length : 0, 'bytes');
    
    // Log slow requests
    if (duration > 5000) {
      console.warn(`⚠️ SLOW REQUEST DETECTED [${requestId}]: ${duration}ms`);
    }
    
    // Log errors
    if (res.statusCode >= 400) {
      console.error(`❌ ERROR RESPONSE [${requestId}]:`, {
        statusCode: res.statusCode,
        duration: duration + 'ms',
        url: req.url,
        method: req.method,
        userId: req.user?.id
      });
    }
    
    console.log('=====================================\n');
    
    // Call original end
    originalEnd.call(this, chunk, encoding);
  };
  
  res.json = function(obj) {
    const duration = Date.now() - startTime;
    console.log(`\n📤 === JSON RESPONSE [${requestId}] ===`);
    console.log('📊 Status:', res.statusCode);
    console.log('⏱️ Duration:', duration + 'ms');
    console.log('📦 Response Size:', JSON.stringify(obj).length, 'bytes');
    
    if (duration > 5000) {
      console.warn(`⚠️ SLOW JSON RESPONSE [${requestId}]: ${duration}ms`);
    }
    
    if (res.statusCode >= 400) {
      console.error(`❌ ERROR JSON RESPONSE [${requestId}]:`, {
        statusCode: res.statusCode,
        duration: duration + 'ms',
        response: obj,
        url: req.url,
        method: req.method,
        userId: req.user?.id
      });
    }
    
    console.log('=====================================\n');
    
    // Call original json
    originalJson.call(this, obj);
  };
  
  next();
};

module.exports = requestLogger;
