require('dotenv').config();
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { Sequelize } = require('sequelize');

// Local database connection
const localSequelize = new Sequelize(
  'networking_dashboard',
  'root',
  '',
  {
    host: '127.0.0.1',
    dialect: 'mysql',
    port: 3306,
    logging: false
  }
);

// Production database connection
const productionSequelize = new Sequelize(
  'PACE_TELECOM_DB',
  'dbuser',
  '01ao2188alho',
  {
    host: '72.61.210.188',
    dialect: 'mysql',
    port: 3306,
    logging: console.log
  }
);

// Import models for both databases
const localModels = {
  User: require('../models/User')(localSequelize, Sequelize.DataTypes),
  Company: require('../models/Company')(localSequelize, Sequelize.DataTypes),
  Customer: require('../models/Customer')(localSequelize, Sequelize.DataTypes),
  Area: require('../models/Area')(localSequelize, Sequelize.DataTypes),
  Connection: require('../models/Connection')(localSequelize, Sequelize.DataTypes),
  Payment: require('../models/Payment')(localSequelize, Sequelize.DataTypes),
  Recharge: require('../models/Recharge')(localSequelize, Sequelize.DataTypes),
  Complaint: require('../models/Complaint')(localSequelize, Sequelize.DataTypes),
  Transaction: require('../models/Transaction')(localSequelize, Sequelize.DataTypes),
  Stock: require('../models/Stock')(localSequelize, Sequelize.DataTypes),
  ActivityLog: require('../models/ActivityLog')(localSequelize, Sequelize.DataTypes),
  PackageRenewal: require('../models/PackageRenewal')(localSequelize, Sequelize.DataTypes),
  SLAPenalty: require('../models/SLAPenalty')(localSequelize, Sequelize.DataTypes)
};

const productionModels = {
  User: require('../models/User')(productionSequelize, Sequelize.DataTypes),
  Company: require('../models/Company')(productionSequelize, Sequelize.DataTypes),
  Customer: require('../models/Customer')(productionSequelize, Sequelize.DataTypes),
  Area: require('../models/Area')(productionSequelize, Sequelize.DataTypes),
  Connection: require('../models/Connection')(productionSequelize, Sequelize.DataTypes),
  Payment: require('../models/Payment')(productionSequelize, Sequelize.DataTypes),
  Recharge: require('../models/Recharge')(productionSequelize, Sequelize.DataTypes),
  Complaint: require('../models/Complaint')(productionSequelize, Sequelize.DataTypes),
  Transaction: require('../models/Transaction')(productionSequelize, Sequelize.DataTypes),
  Stock: require('../models/Stock')(productionSequelize, Sequelize.DataTypes),
  ActivityLog: require('../models/ActivityLog')(productionSequelize, Sequelize.DataTypes),
  PackageRenewal: require('../models/PackageRenewal')(productionSequelize, Sequelize.DataTypes),
  SLAPenalty: require('../models/SLAPenalty')(productionSequelize, Sequelize.DataTypes)
};

async function migrateAllPaceData() {
  try {
    console.log('🔄 Starting complete PACE Telecom data migration...');
    
    // Connect to both databases
    await localSequelize.authenticate();
    console.log('✅ Connected to local database');
    
    await productionSequelize.authenticate();
    console.log('✅ Connected to production database');

    // Sync production models
    await productionSequelize.sync({ alter: false });
    console.log('✅ Production database synced');

    // Start transaction
    const transaction = await productionSequelize.transaction();

    try {
      // 1. Migrate Companies
      console.log('\n🏢 Migrating Companies...');
      const localCompanies = await localModels.Company.findAll({
        where: {
          name: {
            [Sequelize.Op.like]: '%PACE%'
          }
        }
      });

      for (const company of localCompanies) {
        await productionModels.Company.upsert({
          id: company.id,
          name: company.name,
          email: company.email,
          company_id: company.company_id,
          status: company.status,
          createdAt: company.createdAt,
          updatedAt: company.updatedAt
        }, { transaction });
        console.log(`✅ Migrated company: ${company.name}`);
      }

      // Get PACE company ID for foreign key relationships
      const paceCompany = await productionModels.Company.findOne({
        where: { name: { [Sequelize.Op.like]: '%PACE%' } }
      });

      if (!paceCompany) {
        throw new Error('PACE company not found after migration');
      }

      // 2. Migrate Areas (only specific areas)
      console.log('\n📍 Migrating Areas...');
      const allowedAreas = ["katlang", "katti garhi", "jamal garhi", "Ghondo", "Babozo", "Shadand", "katlang bazar"];
      const localAreas = await localModels.Area.findAll({
        where: {
          name: allowedAreas
        }
      });
      for (const area of localAreas) {
        await productionModels.Area.upsert({
          id: area.id,
          name: area.name,
          status: area.status || 'active',
          createdAt: area.createdAt,
          updatedAt: area.updatedAt
        }, { transaction });
      }
      console.log(`✅ Migrated ${localAreas.length} areas`);

      // 3. Migrate Users (PACE company users only)
      console.log('\n👤 Migrating Users...');
      const localUsers = await localModels.User.findAll({
        where: { companyId: paceCompany.id }
      });

      for (const user of localUsers) {
        await productionModels.User.upsert({
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          password_hash: user.password_hash,
          role: user.role,
          status: user.status,
          companyId: user.companyId,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }, { transaction });
      }
      console.log(`✅ Migrated ${localUsers.length} users`);

      // 4. Migrate Customers (only from allowed areas)
      console.log('\n👥 Migrating Customers...');
      const localCustomers = await localModels.Customer.findAll({
        include: [{
          model: localModels.Area,
          where: {
            name: allowedAreas
          }
        }]
      });
      for (const customer of localCustomers) {
        await productionModels.Customer.upsert({
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          areaId: customer.areaId,
          status: customer.status,
          createdAt: customer.createdAt,
          updatedAt: customer.updatedAt
        }, { transaction });
      }
      console.log(`✅ Migrated ${localCustomers.length} customers`);

      // 5. Migrate Connections (only from allowed areas)
      console.log('\n🌐 Migrating Connections...');
      const localConnections = await localModels.Connection.findAll({
        include: [{
          model: localModels.Customer,
          include: [{
            model: localModels.Area,
            where: {
              name: allowedAreas
            }
          }]
        }]
      });
      for (const connection of localConnections) {
        await productionModels.Connection.upsert({
          id: connection.id,
          customerId: connection.customerId,
          username: connection.username,
          password: connection.password,
          packageType: connection.packageType,
          monthlyFee: connection.monthlyFee,
          installationDate: connection.installationDate,
          status: connection.status,
          createdAt: connection.createdAt,
          updatedAt: connection.updatedAt
        }, { transaction });
      }
      console.log(`✅ Migrated ${localConnections.length} connections`);

      // 6. Migrate Payments (only from allowed areas)
      console.log('\n💳 Migrating Payments...');
      const localPayments = await localModels.Payment.findAll({
        include: [{
          model: localModels.Customer,
          include: [{
            model: localModels.Area,
            where: {
              name: allowedAreas
            }
          }]
        }]
      });
      for (const payment of localPayments) {
        await productionModels.Payment.upsert({
          id: payment.id,
          customerId: payment.customerId,
          amount: payment.amount,
          paymentMethod: payment.paymentMethod,
          paymentDate: payment.paymentDate,
          status: payment.status,
          transactionId: payment.transactionId,
          createdAt: payment.createdAt,
          updatedAt: payment.updatedAt
        }, { transaction });
      }
      console.log(`✅ Migrated ${localPayments.length} payments`);

      // 7. Migrate Recharges (only from allowed areas)
      console.log('\n🔄 Migrating Recharges...');
      const localRecharges = await localModels.Recharge.findAll({
        include: [{
          model: localModels.Customer,
          include: [{
            model: localModels.Area,
            where: {
              name: allowedAreas
            }
          }]
        }]
      });
      for (const recharge of localRecharges) {
        await productionModels.Recharge.upsert({
          id: recharge.id,
          customerId: recharge.customerId,
          amount: recharge.amount,
          rechargeDate: recharge.rechargeDate,
          paymentMethod: recharge.paymentMethod,
          status: recharge.status,
          createdAt: recharge.createdAt,
          updatedAt: recharge.updatedAt
        }, { transaction });
      }
      console.log(`✅ Migrated ${localRecharges.length} recharges`);

      // 8. Migrate Complaints (only from allowed areas)
      console.log('\n📋 Migrating Complaints...');
      const localComplaints = await localModels.Complaint.findAll({
        include: [{
          model: localModels.Customer,
          include: [{
            model: localModels.Area,
            where: {
              name: allowedAreas
            }
          }]
        }]
      });
      for (const complaint of localComplaints) {
        await productionModels.Complaint.upsert({
          id: complaint.id,
          customerId: complaint.customerId,
          title: complaint.title,
          description: complaint.description,
          status: complaint.status,
          priority: complaint.priority,
          assignedTo: complaint.assignedTo,
          resolvedAt: complaint.resolvedAt,
          createdAt: complaint.createdAt,
          updatedAt: complaint.updatedAt
        }, { transaction });
      }
      console.log(`✅ Migrated ${localComplaints.length} complaints`);

      // 9. Migrate Transactions (only from allowed areas)
      console.log('\n📊 Migrating Transactions...');
      const localTransactions = await localModels.Transaction.findAll({
        include: [{
          model: localModels.Customer,
          include: [{
            model: localModels.Area,
            where: {
              name: allowedAreas
            }
          }]
        }]
      });
      for (const transaction of localTransactions) {
        await productionModels.Transaction.upsert({
          id: transaction.id,
          customerId: transaction.customerId,
          type: transaction.type,
          amount: transaction.amount,
          description: transaction.description,
          transactionDate: transaction.transactionDate,
          createdAt: transaction.createdAt,
          updatedAt: transaction.updatedAt
        }, { transaction });
      }
      console.log(`✅ Migrated ${localTransactions.length} transactions`);

      // 10. Migrate Stock
      console.log('\n📦 Migrating Stock...');
      const localStock = await localModels.Stock.findAll();
      for (const stock of localStock) {
        await productionModels.Stock.upsert({
          id: stock.id,
          itemName: stock.itemName,
          quantity: stock.quantity,
          unitPrice: stock.unitPrice,
          supplier: stock.supplier,
          status: stock.status,
          createdAt: stock.createdAt,
          updatedAt: stock.updatedAt
        }, { transaction });
      }
      console.log(`✅ Migrated ${localStock.length} stock items`);

      // 11. Migrate Activity Logs
      console.log('\n📝 Migrating Activity Logs...');
      const localActivityLogs = await localModels.ActivityLog.findAll();
      for (const log of localActivityLogs) {
        await productionModels.ActivityLog.upsert({
          id: log.id,
          userId: log.userId,
          action: log.action,
          description: log.description,
          createdAt: log.createdAt,
          updatedAt: log.updatedAt
        }, { transaction });
      }
      console.log(`✅ Migrated ${localActivityLogs.length} activity logs`);

      // 12. Migrate Package Renewals (only from allowed areas)
      console.log('\n🔄 Migrating Package Renewals...');
      const localPackageRenewals = await localModels.PackageRenewal.findAll({
        include: [{
          model: localModels.Customer,
          include: [{
            model: localModels.Area,
            where: {
              name: allowedAreas
            }
          }]
        }]
      });
      for (const renewal of localPackageRenewals) {
        await productionModels.PackageRenewal.upsert({
          id: renewal.id,
          customerId: renewal.customerId,
          oldPackage: renewal.oldPackage,
          newPackage: renewal.newPackage,
          renewalDate: renewal.renewalDate,
          status: renewal.status,
          createdAt: renewal.createdAt,
          updatedAt: renewal.updatedAt
        }, { transaction });
      }
      console.log(`✅ Migrated ${localPackageRenewals.length} package renewals`);

      // 13. Migrate SLA Penalties (only from allowed areas)
      console.log('\n⚖️ Migrating SLA Penalties...');
      const localSLAPenalties = await localModels.SLAPenalty.findAll({
        include: [{
          model: localModels.Customer,
          include: [{
            model: localModels.Area,
            where: {
              name: allowedAreas
            }
          }]
        }]
      });
      for (const penalty of localSLAPenalties) {
        await productionModels.SLAPenalty.upsert({
          id: penalty.id,
          customerId: penalty.customerId,
          complaintId: penalty.complaintId,
          penaltyAmount: penalty.penaltyAmount,
          reason: penalty.reason,
          status: penalty.status,
          createdAt: penalty.createdAt,
          updatedAt: penalty.updatedAt
        }, { transaction });
      }
      console.log(`✅ Migrated ${localSLAPenalties.length} SLA penalties`);

      // Commit transaction
      await transaction.commit();
      console.log('\n🎉 All PACE Telecom data migrated successfully!');
      
      console.log('\n📊 Migration Summary:');
      console.log(`- Companies: ${localCompanies.length}`);
      console.log(`- Areas: ${localAreas.length}`);
      console.log(`- Users: ${localUsers.length}`);
      console.log(`- Customers: ${localCustomers.length}`);
      console.log(`- Connections: ${localConnections.length}`);
      console.log(`- Payments: ${localPayments.length}`);
      console.log(`- Recharges: ${localRecharges.length}`);
      console.log(`- Complaints: ${localComplaints.length}`);
      console.log(`- Transactions: ${localTransactions.length}`);
      console.log(`- Stock: ${localStock.length}`);
      console.log(`- Activity Logs: ${localActivityLogs.length}`);
      console.log(`- Package Renewals: ${localPackageRenewals.length}`);
      console.log(`- SLA Penalties: ${localSLAPenalties.length}`);

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    // Close connections
    await localSequelize.close();
    await productionSequelize.close();
    
    console.log('\n✅ Migration completed successfully!');
    console.log('🌐 Your production site is now ready with all data!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    
    // Close connections
    try {
      await localSequelize.close();
      await productionSequelize.close();
    } catch (closeError) {
      console.error('Error closing connections:', closeError.message);
    }
    
    process.exit(1);
  }
}

migrateAllPaceData();
