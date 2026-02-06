require('dotenv').config();
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/database');
const { User, Company } = require('../models');

async function seedPaceUsers() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connected successfully');

    await sequelize.sync({ alter: false });
    console.log('Models synced');

    // Create or find PACE Telecom company
    console.log('Creating PACE Telecom company...');
    let paceCompany = await Company.findOne({ where: { name: 'PACE Telecom' } });
    
    if (!paceCompany) {
      paceCompany = await Company.create({
        id: uuidv4(),
        name: 'PACE Telecom',
        email: 'info@pacetelecom.com',
        company_id: `ISP-${Date.now()}`,
        status: 'active'
      });
      console.log('PACE Telecom company created');
    } else {
      console.log('PACE Telecom company found');
    }

    console.log('Ready to seed your users...');
    console.log('Company ID:', paceCompany.id);
    console.log('Please provide your user data in the format below:');
    console.log(`
[
  {
    "name": "Full Name",
    "email": "email@example.com", 
    "username": "username",
    "phone": "03001234567",
    "password": "password123",
    "role": "CEO|Manager|Staff|Technician"
  }
]
    `);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

seedPaceUsers();
