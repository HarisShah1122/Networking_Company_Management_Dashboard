// Seed script to create default CEO user using Sequelize
// Run this after creating the database: node database/seed.js

require('dotenv').config({ path: '../.env' });
const { sequelize, User } = require('../src/models');

async function seed() {
  try {
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Connected to database');

    // Sync models (creates tables if they don't exist)
    await sequelize.sync({ alter: false });
    console.log('✅ Database models synced');

    // Check if admin user exists
    const existing = await User.findOne({
      where: { email: 'ceo@company.com' }
    });

    if (existing) {
      console.log('ℹ️  Default CEO user already exists');
      await sequelize.close();
      return;
    }

    // Create default CEO user
    const user = await User.create({
      email: 'ceo@company.com',
      username: 'admin',
      password: 'admin123', // Will be hashed by the beforeCreate hook
      role: 'CEO',
      status: 'active'
    });

    console.log('✅ Default CEO user created:');
    console.log('   Email: ceo@company.com');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   ⚠️  Please change the password after first login!');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    await sequelize.close();
    process.exit(1);
  }
}

seed();
