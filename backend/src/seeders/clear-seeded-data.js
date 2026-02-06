require('dotenv').config();
const sequelize = require('../config/database');
const { User, Customer, Connection, Recharge, Stock, Transaction, Complaint, Area, Payment, Company, ActivityLog } = require('../models');

async function clearSeededData() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connected successfully');

    console.log('Clearing all seeded data...');
    
    // Delete in order to respect foreign key constraints
    await Payment.destroy({ where: {}, force: true });
    await Transaction.destroy({ where: {}, force: true });
    await Complaint.destroy({ where: {}, force: true });
    await Recharge.destroy({ where: {}, force: true });
    await Connection.destroy({ where: {}, force: true });
    await Customer.destroy({ where: {}, force: true });
    await Stock.destroy({ where: {}, force: true });
    await ActivityLog.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
    await Company.destroy({ where: {}, force: true });

    console.log('✅ All seeded data cleared successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing data:', error);
    process.exit(1);
  }
}

clearSeededData();
