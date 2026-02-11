require('dotenv').config();
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { Sequelize } = require('sequelize');

// Direct connection to production database
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

// Import models with production connection
const User = require('../models/User')(productionSequelize, Sequelize.DataTypes);
const Company = require('../models/Company')(productionSequelize, Sequelize.DataTypes);

async function seedProductionUsers() {
  try {
    console.log('🔗 Connecting to production database...');
    await productionSequelize.authenticate();
    console.log('✅ Production database connected successfully');

    await productionSequelize.sync({ alter: false });
    console.log('✅ Production models synced');

    // Create PACE Telecom and Broadcasting Pvt Ltd company
    console.log('🏢 Creating PACE Telecom and Broadcasting Pvt Ltd company...');
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
    console.log('👤 Creating CEO user...');
    const existingUser = await User.findOne({ where: { username: 'aamir_ishaq' } });
    
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

    console.log('\n🎉 Production setup completed!');
    console.log('\n📋 Company Details:');
    console.log(`- Company Name: ${paceCompany.name}`);
    
    console.log('\n👤 CEO Login Details:');
    console.log(`- Username: aamir_ishaq`);
    console.log(`- Email: pacetelecom@gmail.com`);
    console.log(`- Phone: 03444746196`);
    console.log(`- Password: admin123`);
    console.log(`- Role: CEO`);

    await productionSequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await productionSequelize.close();
    process.exit(1);
  }
}

seedProductionUsers();
