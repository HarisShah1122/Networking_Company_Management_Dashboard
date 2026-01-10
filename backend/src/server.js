const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { PORT, CORS_ORIGIN } = require('./config/env');
const { errorHandler } = require('./middleware/error.middleware');
const { sequelize } = require('./models');

// Import routes
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

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes - No rate limiting applied
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
// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    // Sync models (only in development, use migrations in production)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: false });
    }

    app.listen(PORT, () => {
      // Server started successfully
    });
  } catch (error) {
    process.exit(1);
  }
};

startServer();

module.exports = app;

