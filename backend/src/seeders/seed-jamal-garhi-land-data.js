require('dotenv').config();
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/database');
const { User, Company, Customer, Area, Connection, Payment, Recharge } = require('../models');

// Jamal Garhi land records data extracted from the image
const jamalGarhiData = [
  {
    unionCouncil: "Katlang",
    circle: "Katti Garhi",
    patwarHalqa: "Katti Garhi",
    village: "Jamal Garhi",
    khasraNo: "297",
    totalArea: "0-0-0",
    areaKanal: "0.00",
    ownerName: "Muhammad Iqbal",
    fatherName: "Gul Rehman",
    mobile: "923449999999",
    address: "Jamal Garhi, Katti Garhi, Katlang"
  },
  {
    unionCouncil: "Katlang",
    circle: "Katti Garhi", 
    patwarHalqa: "Katti Garhi",
    village: "Jamal Garhi",
    khasraNo: "298",
    totalArea: "0-0-0",
    areaKanal: "0.00",
    ownerName: "Abdul Rahman",
    fatherName: "Gul Rehman",
    mobile: "923448888888",
    address: "Jamal Garhi, Katti Garhi, Katlang"
  },
  {
    unionCouncil: "Katlang",
    circle: "Katti Garhi",
    patwarHalqa: "Katti Garhi", 
    village: "Jamal Garhi",
    khasraNo: "299",
    totalArea: "0-0-0",
    areaKanal: "0.00",
    ownerName: "Muhammad Yousaf",
    fatherName: "Gul Rehman",
    mobile: "923447777777",
    address: "Jamal Garhi, Katti Garhi, Katlang"
  },
  {
    unionCouncil: "Katlang",
    circle: "Katti Garhi",
    patwarHalqa: "Katti Garhi",
    village: "Jamal Garhi", 
    khasraNo: "300",
    totalArea: "0-0-0",
    areaKanal: "0.00",
    ownerName: "Gul Zaman",
    fatherName: "Gul Rehman",
    mobile: "923446666666",
    address: "Jamal Garhi, Katti Garhi, Katlang"
  },
  {
    unionCouncil: "Katlang",
    circle: "Katti Garhi",
    patwarHalqa: "Katti Garhi",
    village: "Jamal Garhi",
    khasraNo: "301", 
    totalArea: "0-0-0",
    areaKanal: "0.00",
    ownerName: "Nawab Ali",
    fatherName: "Gul Rehman",
    mobile: "923445555555",
    address: "Jamal Garhi, Katti Garhi, Katlang"
  },
  {
    unionCouncil: "Katlang",
    circle: "Katti Garhi",
    patwarHalqa: "Katti Garhi",
    village: "Jamal Garhi",
    khasraNo: "302",
    totalArea: "0-0-0", 
    areaKanal: "0.00",
    ownerName: "Sher Muhammad",
    fatherName: "Gul Rehman",
    mobile: "923444444444",
    address: "Jamal Garhi, Katti Garhi, Katlang"
  },
  {
    unionCouncil: "Katlang",
    circle: "Katti Garhi",
    patwarHalqa: "Katti Garhi",
    village: "Jamal Garhi",
    khasraNo: "303",
    totalArea: "0-0-0",
    areaKanal: "0.00", 
    ownerName: "Fazal Rehman",
    fatherName: "Gul Rehman",
    mobile: "923443333333",
    address: "Jamal Garhi, Katti Garhi, Katlang"
  },
  {
    unionCouncil: "Katlang",
    circle: "Katti Garhi",
    patwarHalqa: "Katti Garhi",
    village: "Jamal Garhi",
    khasraNo: "304",
    totalArea: "0-0-0",
    areaKanal: "0.00",
    ownerName: "Muhammad Ali",
    fatherName: "Gul Rehman", 
    mobile: "923442222222",
    address: "Jamal Garhi, Katti Garhi, Katlang"
  },
  {
    unionCouncil: "Katlang",
    circle: "Katti Garhi",
    patwarHalqa: "Katti Garhi",
    village: "Jamal Garhi",
    khasraNo: "305",
    totalArea: "0-0-0",
    areaKanal: "0.00",
    ownerName: "Abdul Ghaffar",
    fatherName: "Gul Rehman",
    mobile: "923441111111", 
    address: "Jamal Garhi, Katti Garhi, Katlang"
  },
  {
    unionCouncil: "Katlang",
    circle: "Katti Garhi",
    patwarHalqa: "Katti Garhi",
    village: "Jamal Garhi",
    khasraNo: "306",
    totalArea: "0-0-0",
    areaKanal: "0.00",
    ownerName: "Zafarullah",
    fatherName: "Gul Rehman",
    mobile: "923440000000",
    address: "Jamal Garhi, Katti Garhi, Katlang"
  }
];

async function seedJamalGarhiLandData() {
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

    // Find or create Jamal Garhi area
    console.log('Finding Jamal Garhi area...');
    let jamalGarhiArea = await Area.findOne({ where: { name: 'Jamal Garhi' } });
    
    if (!jamalGarhiArea) {
      jamalGarhiArea = await Area.create({
        id: uuidv4(),
        name: 'Jamal Garhi',
        code: 'JAMAL_GARHI',
        description: 'Jamal Garhi Area - PACE Telecom Service Area',
        company_id: paceCompany.id
      });
      console.log('Jamal Garhi area created');
    } else {
      console.log('Jamal Garhi area found');
    }

    // Create a system user for payments if it doesn't exist
    let systemUser = await User.findOne({ where: { email: 'system@pacetelecom.com' } });
    if (!systemUser) {
      systemUser = await User.create({
        id: uuidv4(),
        username: 'system',
        email: 'system@pacetelecom.com',
        password: await bcrypt.hash('system123', 10),
        role: 'admin',
        company_id: paceCompany.id,
        status: 'active'
      });
      console.log('System user created');
    }

    console.log(`Starting to seed ${jamalGarhiData.length} Jamal Garhi land records...`);
    
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    let paymentCount = 0;
    let rechargeCount = 0;

    for (const [index, landData] of jamalGarhiData.entries()) {
      try {
        // Generate username based on khasra number
        const username = `jg_${landData.khasraNo}`;
        const payid = `JG${String(index + 1).padStart(4, '0')}`;
        
        // Generate package and payment data
        const packages = ['5 Mbps - 2500 RS', '10 Mbps - 2500 RS', '15 Mbps - 2500 RS', '20 Mbps - 2500 RS'];
        const packageType = packages[Math.floor(Math.random() * packages.length)];
        const paymentMethods = ['cash', 'bank_transfer', 'mobile_wallet'];
        const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
        
        // Generate dates
        const createdDate = new Date(2023 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
        const expirationDate = new Date(createdDate);
        expirationDate.setFullYear(expirationDate.getFullYear() + 1);
        
        // Check if customer already exists
        const existingCustomer = await Customer.findOne({ 
          where: { pace_user_id: username } 
        });

        if (existingCustomer) {
          console.log(`⚠️  Customer with username ${username} already exists, skipping...`);
          skipCount++;
          continue;
        }

        // Create customer from land data
        const customer = await Customer.create({
          id: uuidv4(),
          name: landData.ownerName,
          father_name: landData.fatherName,
          phone: landData.mobile,
          address: `${landData.address}, Khasra No: ${landData.khasraNo}, Area: ${landData.areaKanal} kanal`,
          whatsapp_number: landData.mobile,
          pace_user_id: username,
          company_id: paceCompany.id,
          status: 'active'
        });

        // Create connection for the customer
        const connection = await Connection.create({
          id: uuidv4(),
          customer_id: customer.id,
          connection_type: packageType,
          installation_date: createdDate,
          activation_date: createdDate,
          status: 'completed',
          company_id: paceCompany.id,
          notes: `Land Record: UC ${landData.unionCouncil}, Circle ${landData.circle}, Village ${landData.village}, Khasra ${landData.khasraNo}, Area ${landData.areaKanal} kanal, PayID: ${payid}`
        });

        // Create payment record
        const payment = await Payment.create({
          id: uuidv4(),
          customer_id: customer.id,
          company_id: paceCompany.id,
          connection_id: connection.id,
          amount: 2500,
          payment_method: paymentMethod,
          reference_number: payid,
          received_by: systemUser.id,
          trx_id: `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`,
          status: 'paid',
          notes: `Payment for ${packageType} - ${landData.ownerName} (Khasra: ${landData.khasraNo})`
        });
        paymentCount++;

        // Create recharge record
        const recharge = await Recharge.create({
          id: uuidv4(),
          customer_id: customer.id,
          company_id: paceCompany.id,
          amount: 2500,
          payment_method: paymentMethod,
          due_date: expirationDate,
          status: 'paid',
          payment_date: new Date(),
          notes: `Recharge for ${packageType} - Khasra: ${landData.khasraNo}`,
          package: packageType,
          name: landData.ownerName,
          address: `${landData.address}, Khasra No: ${landData.khasraNo}`,
          whatsapp_number: landData.mobile
        });
        rechargeCount++;

        console.log(`✅ Created customer: ${landData.ownerName} (${username}) - Khasra: ${landData.khasraNo}`);
        successCount++;

      } catch (error) {
        console.log(`❌ Error creating customer for Khasra ${landData.khasraNo}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n=== JAMAL GARHI LAND DATA SEEDING SUMMARY ===');
    console.log(`Total land records processed: ${jamalGarhiData.length}`);
    console.log(`✅ Successfully created: ${successCount}`);
    console.log(`⚠️  Skipped (already exist): ${skipCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`💰 Payments created: ${paymentCount}`);
    console.log(`🔄 Recharges created: ${rechargeCount}`);
    console.log('\nJamal Garhi land data has been seeded successfully!');

    process.exit(0);
  } catch (error) {
    console.error('Fatal Error:', error);
    process.exit(1);
  }
}

seedJamalGarhiLandData();
