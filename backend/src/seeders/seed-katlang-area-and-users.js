require('dotenv').config();
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/database');
const { User, Area, Customer, Connection, Company } = require('../models');

// Katlang area specific users
const KATLANG_USERS = [
  {
    name: "Muhammad Fayaz",
    username: "fayaz.katlang",
    email: "muhammad.fayaz@gmail.com",
    phone: "03425500045",
    role: "Customer",
    address: "Qazi Abad, Katlang",
    package: "5 Mbps",
    area: "Katlang"
  },
  {
    name: "Shaha Fahad",
    username: "fahad.katlang",
    email: "shaha.fahad@yahoo.com", 
    phone: "03199518205",
    role: "Customer",
    address: "Konj, Katlang",
    package: "5 Mbps",
    area: "Katlang"
  },
  {
    name: "Abdul Rahman",
    username: "rahman.katlang",
    email: "abdul.rahman@outlook.com",
    phone: "03234567890",
    role: "Customer",
    address: "Main Bazaar, Katlang",
    package: "10 Mbps",
    area: "Katlang"
  },
  {
    name: "Gul Muhammad",
    username: "gul.katlang",
    email: "gul.muhammad@hotmail.com",
    phone: "03334567891",
    role: "Customer",
    address: "Shahbaz Garhi, Katlang",
    package: "5 Mbps",
    area: "Katlang"
  },
  {
    name: "Nawab Khan",
    username: "nawab.katlang",
    email: "nawab.khan@gmail.com",
    phone: "03434567892",
    role: "Customer",
    address: "Pirsabaq, Katlang",
    package: "15 Mbps",
    area: "Katlang"
  },
  {
    name: "Zar Muhammad",
    username: "zar.katlang",
    email: "zar.muhammad@yahoo.com",
    phone: "03534567893",
    role: "Customer",
    address: "Sawaldher, Katlang",
    package: "5 Mbps",
    area: "Katlang"
  },
  {
    name: "Mian Baba",
    username: "mian.katlang",
    email: "mian.baba@outlook.com",
    phone: "03634567894",
    role: "Customer",
    address: "Toru, Katlang",
    package: "10 Mbps",
    area: "Katlang"
  },
  {
    name: "Khalid Khan",
    username: "khalid.katlang",
    email: "khalid.khan@hotmail.com",
    phone: "03734567895",
    role: "Customer",
    address: "Mangal, Katlang",
    package: "5 Mbps",
    area: "Katlang"
  }
];

// Katlang area staff
const KATLANG_STAFF = [
  {
    name: "Shakeel Ahmed",
    username: "shakeel.tech",
    email: "shakeel.tech@networkingcompany.com",
    phone: "03071234574",
    role: "Staff",
    area: "Katlang"
  },
  {
    name: "Irfan Khan",
    username: "irfan.tech",
    email: "irfan.tech@networkingcompany.com", 
    phone: "03081234575",
    role: "Staff",
    area: "Katlang"
  },
  {
    name: "Tariq Mehmood",
    username: "tariq.manager",
    email: "tariq.manager@networkingcompany.com",
    phone: "03091234576",
    role: "Manager",
    area: "Katlang"
  }
];

// All 5 areas that should exist
const ALL_AREAS = [
  {
    name: "Katlang",
    code: "KATLANG_001",
    description: "Katlang area - Main service area with high customer density"
  },
  {
    name: "Katti Garhi", 
    code: "KATTI_GARHI_001",
    description: "Katti Garhi area - Residential and commercial zone"
  },
  {
    name: "Jamal Garhi",
    code: "JAMAL_GARHI_001", 
    description: "Jamal Garhi area - Rural service area"
  },
  {
    name: "Ghondo",
    code: "GHONDO_001",
    description: "Ghondo area - Agricultural zone"
  },
  {
    name: "Babozo",
    code: "BABOZO_001",
    description: "Babozo area - Mixed residential area"
  }
];

async function seedKatlangAreaAndUsers() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully.');

    // Get or create company
    let company = await Company.findOne();
    if (!company) {
      company = await Company.create({
        id: uuidv4(),
        name: "Networking Company",
        email: "info@networkingcompany.com",
        phone: "03123456789",
        address: "Mardan City, KPK, Pakistan"
      });
      console.log('✅ Created company:', company.name);
    }
    
    const companyId = company.id;
    console.log(`📋 Using company ID: ${companyId}`);

    // Seed all 5 areas
    console.log('\n🏢 Seeding all areas...');
    for (const areaData of ALL_AREAS) {
      const [area, created] = await Area.findOrCreate({
        where: { name: areaData.name },
        defaults: {
          id: uuidv4(),
          name: areaData.name,
          code: areaData.code,
          description: areaData.description,
          company_id: companyId
        }
      });
      
      if (created) {
        console.log(`✅ Created area: ${areaData.name}`);
      } else {
        console.log(`ℹ️  Area already exists: ${areaData.name}`);
      }
    }

    // Get Katlang area ID for assigning users
    const katlangArea = await Area.findOne({ where: { name: 'Katlang' } });
    if (!katlangArea) {
      throw new Error('Katlang area not found after seeding!');
    }

    // Seed Katlang staff
    console.log('\n👥 Seeding Katlang staff...');
    const staffPasswordHash = await bcrypt.hash('staff123', 10);
    
    for (const staffMember of KATLANG_STAFF) {
      const [user, created] = await User.findOrCreate({
        where: { username: staffMember.username },
        defaults: {
          id: uuidv4(),
          email: staffMember.email,
          username: staffMember.username,
          phone: staffMember.phone,
          password_hash: staffPasswordHash,
          role: staffMember.role,
          status: 'active',
          company_id: companyId
        }
      });
      
      if (created) {
        console.log(`✅ Created staff: ${staffMember.name} (${staffMember.role})`);
      } else {
        console.log(`ℹ️  Staff already exists: ${staffMember.name}`);
      }
    }

    // Seed Katlang customers
    console.log('\n👨‍👩‍👧‍👦 Seeding Katlang customers...');
    const customerPasswordHash = await bcrypt.hash('customer123', 10);
    
    for (const customerData of KATLANG_USERS) {
      // Create user first
      const [user, userCreated] = await User.findOrCreate({
        where: { username: customerData.username },
        defaults: {
          id: uuidv4(),
          email: customerData.email,
          username: customerData.username,
          phone: customerData.phone,
          password_hash: customerPasswordHash,
          role: 'Customer',
          status: 'active',
          company_id: companyId
        }
      });

      // Create customer profile
      const [customer, customerCreated] = await Customer.findOrCreate({
        where: { pace_user_id: user.username },
        defaults: {
          id: uuidv4(),
          name: customerData.name,
          email: customerData.email,
          phone: customerData.phone,
          address: customerData.address,
          pace_user_id: customerData.username,
          company_id: companyId,
          status: 'active'
        }
      });

      // Create connection
      if (customerCreated) {
        await Connection.findOrCreate({
          where: { customer_id: customer.id },
          defaults: {
            id: uuidv4(),
            customer_id: customer.id,
            connection_type: customerData.package,
            installation_date: new Date(),
            status: 'completed',
            company_id: companyId
          }
        });
      }

      if (userCreated) {
        console.log(`✅ Created customer: ${customerData.name}`);
      } else {
        console.log(`ℹ️  Customer already exists: ${customerData.name}`);
      }
    }

    console.log('\n🎉 Katlang Area Seeding Complete!');
    console.log(`📊 Summary:`);
    console.log(`   - Areas processed: ${ALL_AREAS.length}`);
    console.log(`   - Staff created: ${KATLANG_STAFF.length}`);
    console.log(`   - Customers created: ${KATLANG_USERS.length}`);
    console.log('\n🔑 Login Credentials:');
    console.log('   - Staff password: staff123');
    console.log('   - Customer password: customer123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding Katlang area:', error);
    process.exit(1);
  }
}

function getPackagePrice(packageType) {
  const prices = {
    '5 Mbps': 1000,
    '10 Mbps': 1500,
    '15 Mbps': 2000,
    '20 Mbps': 2500
  };
  return prices[packageType] || 1000;
}

// Run seeder
seedKatlangAreaAndUsers();
