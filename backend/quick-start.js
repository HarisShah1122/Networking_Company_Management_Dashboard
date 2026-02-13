console.log('🚀 Starting backend server on port 5001...');

try {
  require('./src/server');
  console.log('✅ Server started successfully!');
} catch (error) {
  console.error('❌ Server failed to start:', error.message);
  console.error('Full error:', error);
}
