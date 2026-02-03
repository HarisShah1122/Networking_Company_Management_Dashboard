require('dotenv').config();
const sequelize = require('../config/database');
const { User } = require('../models');

async function checkExistingUsers() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    console.log('Checking existing staff users...');
    
    const users = await User.findAll({
      where: {
        role: ['Manager', 'Staff']
      },
      attributes: ['id', 'username', 'email', 'phone', 'role']
    });

    console.log('\n=== Existing Staff Users ===');
    users.forEach(user => {
      console.log(`Username: ${user.username} | Email: ${user.email} | Phone: ${user.phone || 'N/A'} | Role: ${user.role}`);
    });

    console.log(`\nTotal staff users found: ${users.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking users:', error);
    process.exit(1);
  }
}

// Run checker
checkExistingUsers();
