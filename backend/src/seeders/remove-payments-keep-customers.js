require('dotenv').config();
const sequelize = require('../config/database');
const { Payment, Recharge, Transaction, Customer, Company } = require('../models');

async function removePaymentsKeepCustomers() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connected successfully');

    // Get PACE Telecom company
    const paceCompany = await Company.findOne({ where: { name: 'PACE Telecom' } });
    if (!paceCompany) {
      console.log('❌ PACE Telecom company not found');
      process.exit(1);
    }

    // Count records before deletion
    const customerCount = await Customer.count({
      where: { company_id: paceCompany.id }
    });
    const paymentCount = await Payment.count({
      where: { company_id: paceCompany.id }
    });
    const rechargeCount = await Recharge.count({
      where: { company_id: paceCompany.id }
    });
    const transactionCount = await Transaction.count({
      where: { company_id: paceCompany.id }
    });

    console.log('\n=== BEFORE CLEANUP ===');
    console.log(`👥 Customers: ${customerCount}`);
    console.log(`💰 Payments: ${paymentCount}`);
    console.log(`🔄 Recharges: ${rechargeCount}`);
    console.log(`📊 Transactions: ${transactionCount}`);

    // Remove all payment records
    console.log('\n🗑️  Removing payment records...');
    const deletedPayments = await Payment.destroy({
      where: { company_id: paceCompany.id }
    });
    console.log(`✅ Deleted ${deletedPayments} payment records`);

    // Remove all recharge records
    console.log('🗑️  Removing recharge records...');
    const deletedRecharges = await Recharge.destroy({
      where: { company_id: paceCompany.id }
    });
    console.log(`✅ Deleted ${deletedRecharges} recharge records`);

    // Remove all transaction records
    console.log('🗑️  Removing transaction records...');
    const deletedTransactions = await Transaction.destroy({
      where: { company_id: paceCompany.id }
    });
    console.log(`✅ Deleted ${deletedTransactions} transaction records`);

    // Verify customers are still there
    const remainingCustomers = await Customer.count({
      where: { company_id: paceCompany.id }
    });

    console.log('\n=== AFTER CLEANUP ===');
    console.log(`👥 Customers: ${remainingCustomers} (kept)`);
    console.log(`💰 Payments: 0 (removed)`);
    console.log(`🔄 Recharges: 0 (removed)`);
    console.log(`📊 Transactions: 0 (removed)`);

    console.log('\n✅ All payment records removed successfully!');
    console.log('👥 All customer data preserved in database');
    console.log('💰 Accounts page will now show RS 0.00');
    console.log('📊 Revenue chart will show no data');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

removePaymentsKeepCustomers();
