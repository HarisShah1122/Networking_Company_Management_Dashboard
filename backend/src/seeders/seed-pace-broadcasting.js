require('dotenv').config();
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/database');
const { User, Company } = require('../models');

async function seedPaceBroadcasting() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connected successfully');

    await sequelize.sync({ alter: false });
    console.log('Models synced');

    // Create PACE Telecom and Broadcasting Pvt Ltd company
    console.log('Creating PACE Telecom and Broadcasting Pvt Ltd company...');
    let paceCompany = await Company.findOne({ where: { name: 'PACE Telecom and Broadcasting Pvt Ltd' } });
    
    if (!paceCompany) {
      paceCompany = await Company.create({
        id: uuidv4(),
        name: 'PACE Telecom and Broadcasting Pvt Ltd',
        email: 'broadcasting@pacetelecom.com',
        company_id: `PTB-${Date.now()}`,
        status: 'active'
      });
      console.log('✅ PACE Telecom and Broadcasting Pvt Ltd company created');
    } else {
      console.log('✅ PACE Telecom and Broadcasting Pvt Ltd company found');
    }

    // Create CEO user for the company
    console.log('Creating CEO user...');
    const existingUser = await User.findOne({ where: { email: 'pacetelecom@gmail.com' } });
    
    if (!existingUser) {
      const passwordHash = await bcrypt.hash('admin123', 10);
      
      const ceoUser = await User.create({
        id: uuidv4(),
        email: 'pacetelecom@gmail.com',
        username: 'aamir_ishaq',
        phone: '03444746196',
        password_hash: passwordHash,
        role: 'CEO',
        status: 'active',
        companyId: paceCompany.id
      });
      
      console.log('✅ CEO user created successfully');
    } else {
      console.log('✅ CEO user already exists');
    }

    console.log('\n🎉 PACE Telecom and Broadcasting Pvt Ltd setup completed!');
    console.log('\n📋 Company Details:');
    console.log(`- Company Name: ${paceCompany.name}`);
    
    console.log('\n👤 CEO Login Details:');
    console.log(`- Username: aamir_ishaq`);
    console.log(`- Email: pacetelecom@gmail.com`);
    console.log(`- Phone: 03444746196`);
    console.log(`- Password: admin123`);
    console.log(`- Role: CEO`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

seedPaceBroadcasting();
