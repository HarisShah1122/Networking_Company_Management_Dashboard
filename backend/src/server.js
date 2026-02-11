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
if (!SESSION_SECRET) {
  }
const app = express();
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
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'], 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'))
);
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
      httpOnly: true,
      secure: false, // Set to false for local development
      sameSite: 'lax',
    },
  })
);
/* ROUTES */
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