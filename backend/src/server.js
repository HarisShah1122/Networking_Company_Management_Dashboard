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
const paymentRoutes = require('./routes/payment.routes');
const packageRenewalRoutes = require('./routes/packageRenewal.routes');
const areaRoutes = require('./routes/area.routes');


if (!SESSION_SECRET) {
  throw new Error('SESSION_SECRET missing in .env');
}

const app = express();

/* MIDDLEWARE */
app.use(helmet());
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
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
      secure: NODE_ENV === 'production',
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
app.use('/api/payments', paymentRoutes);
app.use('/api/package-renewals', packageRenewalRoutes);
app.use('/api/areas', areaRoutes);

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

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Server failed:', error);
    process.exit(1);
  }
})();

module.exports = app;
