const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const path = require('path');

// Load environment variables
require('dotenv').config();

const {
  PORT,
  CORS_ORIGIN,
  NODE_ENV,
  SESSION_SECRET,
} = require('../backend/src/config/env');

const { errorHandler } = require('../backend/src/middleware/error.middleware');
const { sequelize } = require('../backend/src/models');

// Import routes
const authRoutes = require('../backend/src/routes/auth.routes');
const companyRoutes = require('../backend/src/routes/company.routes');
const customerRoutes = require('../backend/src/routes/customer.routes');
const connectionRoutes = require('../backend/src/routes/connection.routes');
const rechargeRoutes = require('../backend/src/routes/recharge.routes');
const stockRoutes = require('../backend/src/routes/stock.routes');
const transactionRoutes = require('../backend/src/routes/transaction.routes');
const userRoutes = require('../backend/src/routes/user.routes');
const complaintRoutes = require('../backend/src/routes/complaint.routes');
const paymentRoutes = require('../backend/src/routes/payment.routes');
const packageRenewalRoutes = require('../backend/src/routes/packageRenewal.routes');
const areaRoutes = require('../backend/src/routes/area.routes');

if (!SESSION_SECRET) {
  throw new Error('SESSION_SECRET missing in environment');
}

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session setup
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
      secure: NODE_ENV === 'production',
      sameSite: 'lax',
    },
  })
);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/recharges', rechargeRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/package-renewals', packageRenewalRoutes);
app.use('/api/areas', areaRoutes);

// Error handling
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});
app.use(errorHandler);

// Initialize database (only if not in serverless environment)
if (process.env.NODE_ENV !== 'production') {
  (async () => {
    try {
      await sequelize.authenticate();
      console.log('✅ Database connected');
      app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
      });
    } catch (error) {
      console.error('❌ Server failed:', error);
      process.exit(1);
    }
  })();
}

// Export for Vercel serverless
module.exports = (req, res) => {
  app(req, res);
};
