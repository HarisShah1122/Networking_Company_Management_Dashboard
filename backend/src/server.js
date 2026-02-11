const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const path = require('path');
const {
  PORT,
  CORS_ORIGIN,
  NODE_ENV,
  SESSION_SECRET,
} = require('./config/env');
const { errorHandler } = require('./middleware/error.middleware');
const { sequelize } = require('./models');
const slaMonitor = require('./services/slaMonitor.service');
/* ROUTES */
const authRoutes = require('./routes/auth.routes');
const companyRoutes = require('./routes/company.routes');
const customerRoutes = require('./routes/customer.routes');
const connectionRoutes = require('./routes/connection.routes');
const rechargeRoutes = require('./routes/recharge.routes');
const stockRoutes = require('./routes/stock.routes');
const transactionRoutes = require('./routes/transaction.routes');
const userRoutes = require('./routes/user.routes');
const complaintRoutes = require('./routes/complaint.routes');
const externalComplaintRoutes = require('./routes/externalComplaint.routes');
const paymentRoutes = require('./routes/payment.routes');
const packageRenewalRoutes = require('./routes/packageRenewal.routes');
const areaRoutes = require('./routes/area.routes');
const testWhatsAppRoutes = require('./routes/testWhatsApp');
const whatsappWebhookRoutes = require('./routes/whatsappWebhook');
const assignmentRoutes = require('./routes/assignment');
const notificationRoutes = require('./routes/notification.routes');

const app = express();

// Static file serving for uploads - must be first
app.use('/uploads', (req, res, next) => {
  const filePath = path.join(__dirname, '..', 'uploads', req.path.replace('/uploads/', ''));
  
  // Check if file exists
  if (!require('fs').existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  // Get file extension
  const ext = path.extname(filePath).toLowerCase();
  const baseName = path.basename(filePath, ext);
  
  // Detect MIME type
  let mimeType = 'application/octet-stream'; // default
  
  // Check for image files by extension or common patterns
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(ext)) {
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg', 
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.bmp': 'image/bmp'
    };
    mimeType = mimeTypes[ext];
  }
  // Handle files without extensions but with image-like names
  else if (baseName.includes('receipt') || baseName.includes('recipt')) {
    // Try to detect image type by reading file header
    try {
      const buffer = require('fs').readFileSync(filePath);
      const header = buffer.toString('hex', 0, 8);
      
      // Detect image type by magic numbers
      if (header.startsWith('ffd8ffe0')) mimeType = 'image/jpeg';
      else if (header.startsWith('89504e47')) mimeType = 'image/png';
      else if (header.startsWith('47494638')) mimeType = 'image/gif';
      else if (header.startsWith('52494649')) mimeType = 'image/webp';
      else mimeType = 'image/jpeg'; // default for receipts
    } catch (err) {
      console.log('Error reading file for MIME detection:', err);
      mimeType = 'image/jpeg'; // fallback
    }
  }
  
  // Set headers
  res.setHeader('Content-Type', mimeType);
  res.setHeader('Content-Disposition', `inline; filename="${baseName}${ext || '.jpg'}"`);
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Send file
  res.sendFile(filePath);
});

/* MIDDLEWARE */
app.use(helmet());

// Add request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log('\n🔧 === BACKEND API REQUEST ===');
  console.log('⏰ Timestamp:', timestamp);
  console.log('📡 Method:', req.method);
  console.log('🔗 URL:', req.url);
  console.log('🌐 Origin:', req.get('Origin') || 'No Origin');
  console.log('🖥️ User-Agent:', req.get('User-Agent'));
  console.log('🍪 Cookies:', req.headers.cookie ? 'Present' : 'None');
  console.log('📤 Request Headers:', JSON.stringify(req.headers, null, 2));
  console.log('============================\n');
  
  // Add response time header
  const startTime = Date.now();
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    console.log('\n✅ === BACKEND API RESPONSE ===');
    console.log('🔗 URL:', req.url);
    console.log('📊 Status Code:', res.statusCode);
    console.log('⏱️ Response Time:', responseTime + 'ms');
    console.log('=============================\n');
  });
  
  next();
});

app.use(cors({ 
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001', 'http://localhost:3002', 'http://localhost:3003'], 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* SESSION SETUP */
app.use(
  session({
    name: 'pace.sid',
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: new SequelizeStore({ db: sequelize }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      httpOnly: false,
      secure: false, 
      sameSite: 'lax',
    },
  })
);
/* ROUTES */
// Serve uploaded files
app.get('/uploads/*', (req, res) => {
  const filePath = path.join(__dirname, '..', 'uploads', req.params[0]);
  console.log('📁 Upload request:', req.params[0]);
  console.log('📂 Full path:', filePath);
  
  if (require('fs').existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'File not found', path: req.params[0] });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/recharges', rechargeRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/external-complaints', externalComplaintRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/package-renewals', packageRenewalRoutes);
app.use('/api/areas', areaRoutes);
app.use('/api/test-whatsapp', testWhatsAppRoutes);
app.use('/webhook', whatsappWebhookRoutes);
app.use('/api/assignment', assignmentRoutes);
app.use('/api/notifications', notificationRoutes);
/* ERROR HANDLING */
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});
app.use(errorHandler);
/* START SERVER */
(async () => {
  try {
    console.log('\n🚀 === BACKEND SERVER STARTING ===');
    console.log('🌍 Environment:', NODE_ENV);
    console.log('🔧 Port:', PORT);
    console.log('🌐 CORS Origins:', JSON.stringify(CORS_ORIGIN));
    console.log('🗄️ Database Host:', process.env.DB_HOST);
    console.log('🗄️ Database Name:', process.env.DB_NAME);
    console.log('===============================\n');
    
    await sequelize.authenticate();
    console.log('✅ Database connected successfully!');
    
    // Sync database to create Sessions table
    await sequelize.sync({ alter: false });
    console.log('✅ Database synchronized successfully!');
    
    // Ensure Sessions table exists for connect-session-sequelize
    const Session = require('./models/Session')(sequelize, require('sequelize').DataTypes);
    await Session.sync({ force: false });
    console.log('✅ Sessions table ensured!');
    
    // Start SLA Monitor
    slaMonitor.start();
    
    app.listen(PORT, () => {
      console.log('\n🎉 === SERVER STARTED SUCCESSFULLY ===');
      console.log('🌐 Server URL:', `http://localhost:${PORT}`);
      console.log('📍 API Base URL:', `http://localhost:${PORT}/api`);
      console.log('🌍 Environment:', NODE_ENV);
      console.log('⏰ Started at:', new Date().toISOString());
      console.log('===================================\n');
    });
  } catch (error) {
    console.error('\n❌ === SERVER STARTUP FAILED ===');
    console.error('❌ Database connection failed!');
    console.error('🔍 Error Details:', error.message);
    console.error('🔧 Troubleshooting Steps:');
    console.error('   1. Check if database server is running');
    console.error('   2. Verify database credentials and connection parameters');
    console.error('   3. Ensure database exists and is accessible');
    console.error('   4. Check network connectivity to database server');
    console.error('📊 Connection Info:', {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306
    });
    console.error('================================\n');
    process.exit(1);
  }
})();

module.exports = app;