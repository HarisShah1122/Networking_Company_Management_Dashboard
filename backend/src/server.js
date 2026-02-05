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
if (!SESSION_SECRET) {
  throw new Error('SESSION_SECRET missing in .env');
}
const app = express();
/* MIDDLEWARE */
app.use(helmet());
app.use(cors({ 
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'], 
  credentials: true 
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  '/uploads',
  express.static(path.join(__dirname, '../uploads'))
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
/* ERROR HANDLING */
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});
app.use(errorHandler);
/* START SERVER */
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    // Start SLA Monitor
    console.log('🕒 Starting SLA Monitor...');
    slaMonitor.start();
    
    if (process.env.NODE_ENV !== 'production') {
      app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log('📊 SLA monitoring is active');
        console.log('⏰ Checking overdue complaints every 5 minutes');
        console.log('💰 Applying penalties every 10 minutes');
      });
    }
  } catch (error) {
    console.error('❌ Server failed:', error);
    process.exit(1);
  }
})();

module.exports = app;