const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { PORT, CORS_ORIGIN, NODE_ENV } = require('./config/env');
const { errorHandler } = require('./middleware/error.middleware');
const { sequelize, User, Customer, Connection, Recharge, Stock, Transaction, ActivityLog, Complaint, Payment, PackageRenewal } = require('./models');

const authRoutes = require('./routes/auth.routes');
const customerRoutes = require('./routes/customer.routes');
const connectionRoutes = require('./routes/connection.routes');
const rechargeRoutes = require('./routes/recharge.routes');
const stockRoutes = require('./routes/stock.routes');
const transactionRoutes = require('./routes/transaction.routes');
const userRoutes = require('./routes/user.routes');
const complaintRoutes = require('./routes/complaint.routes');
const paymentRoutes = require('./routes/payment.routes');
const packageRenewalRoutes = require('./routes/packageRenewal.routes');

const app = express();

app.use(helmet());
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/recharges', rechargeRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/package-renewals', packageRenewalRoutes);

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use(errorHandler);

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully');

    if (NODE_ENV === 'development') {
      // Sync all models without forcing drop
      await sequelize.sync({ alter: true });
      console.log('All models synced with database');
    }

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.log(error)
    process.exit(1);
  }
};

startServer();

module.exports = app;
