require('dotenv').config();
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/database');
const { User, Company, Customer, Area, Connection, Payment, Recharge } = require('../models');

// Generate comprehensive user data for 2149 users
function generateAllUsers() {
  const users = [];
  const firstNames = ['Muhammad', 'Ahmed', 'Ali', 'Usman', 'Abdul', 'Bilal', 'Omar', 'Hassan', 'Hussain', 'Fahad', 'Saad', 'Zain', 'Hamza', 'Yousaf', 'Ibrahim', 'Isaac', 'Yaseen', 'Zubair', 'Talha', 'Aamir'];
  const lastNames = ['Khan', 'Shah', 'Ali', 'Ahmed', 'Hussain', 'Raza', 'Bhatti', 'Gujjar', 'Malik', 'Butt', 'Chaudhary', 'Qureshi', 'Ansari', 'Siddiqui', 'Farooqi', 'Khan', 'Yousafzai', 'Bangash', 'Khattak', 'Wazir'];
  // ONLY these 5 areas are allowed - no other areas will be used
const areas = ['Katlang', 'Katti Garhi Adda', 'Jamal Garhi', 'Babozo', 'Shamozo'];
  const packages = ['5 Mbps - 2500 RS', '10 Mbps - 2500 RS', '15 Mbps - 2500 RS', '20 Mbps - 2500 RS', '30 Mbps - 2500 RS', '50 Mbps - 2500 RS'];
  const paymentMethods = ['cash', 'bank_transfer', 'mobile_wallet', 'card'];
  
  for (let i = 1; i <= 2149; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const area = areas[Math.floor(Math.random() * areas.length)];
    const packageType = packages[Math.floor(Math.random() * packages.length)];
    const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    
    // Generate realistic mobile numbers
    const mobilePrefix = Math.random() > 0.5 ? '9234' : '9233';
    const mobileNumber = mobilePrefix + Math.floor(Math.random() * 90000000 + 10000000);
    
    // Generate realistic addresses
    const streetTypes = ['Street', 'Road', 'Lane', 'Boulevard', 'Avenue', 'Colony', 'Block', 'Sector'];
    const streetType = streetTypes[Math.floor(Math.random() * streetTypes.length)];
    const houseNumber = Math.floor(Math.random() * 999 + 1);
    const streetNumber = Math.floor(Math.random() * 99 + 1);
    
    const address = `House #${houseNumber}, ${streetType} #${streetNumber}, ${area} District`;
    
    // Generate dates
    const createdYear = 2020 + Math.floor(Math.random() * 6);
    const createdMonth = Math.floor(Math.random() * 12) + 1;
    const createdDay = Math.floor(Math.random() * 28) + 1;
    const createdDate = `${createdMonth}/${createdDay}/${createdYear}`;
    
    const expirationYear = createdYear + 1;
    const expirationMonth = Math.floor(Math.random() * 12) + 1;
    const expirationDay = Math.floor(Math.random() * 28) + 1;
    const expirationDate = `${expirationMonth}/${expirationDay}/${expirationYear} 12:00`;
    
    // Generate payment amounts - all users pay 2500 RS
    const amount = 2500;
    
    users.push({
      username: `user${String(i).padStart(4, '0')}`,
      payid: Math.floor(Math.random() * 900000 + 100000).toString(),
      package: packageType,
      firstname: firstName,
      lastname: lastName,
      address: address,
      city: area,
      mobile: mobileNumber.toString(),
      expiration: expirationDate,
      created_on: createdDate,
      owner: 'system',
      paymentAmount: amount,
      paymentMethod: paymentMethod,
      paymentStatus: Math.random() > 0.1 ? 'paid' : 'pending',
      whatsappNumber: mobileNumber.toString()
    });
  }
  
  return users;
}

async function seedAllUsersComplete() {
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

    // ONLY create these 5 specific areas - no other areas allowed
    console.log('Creating ONLY the 5 required areas...');
    const areaNames = ['Katlang', 'Katti Garhi Adda', 'Jamal Garhi', 'Babozo', 'Shamozo'];
    const areaMap = {};
    
    for (const areaName of areaNames) {
      let area = await Area.findOne({ where: { name: areaName } });
      if (!area) {
        area = await Area.create({
          id: uuidv4(),
          name: areaName,
          code: areaName.toUpperCase().substring(0, 8).replace(/\s+/g, '_'),
          description: `${areaName} Area - PACE Telecom Service Area`,
          company_id: paceCompany.id
        });
        console.log(`✅ Created area: ${areaName}`);
      } else {
        console.log(`✅ Area exists: ${areaName}`);
      }
      areaMap[areaName] = area;
    }
    console.log(`Only ${areaNames.length} areas are configured: ${areaNames.join(', ')}`);
    console.log('Areas created/found');

    // Generate all users
    const allUsers = generateAllUsers();
    console.log(`Generated ${allUsers.length} users for seeding`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    let paymentCount = 0;
    let rechargeCount = 0;

    console.log('Starting to seed all users with payments and addresses...');
    
    for (const userData of allUsers) {
      try {
        // Check if customer already exists
        const existingCustomer = await Customer.findOne({ 
          where: { pace_user_id: userData.username } 
        });

        if (existingCustomer) {
          console.log(`⚠️  Customer with username ${userData.username} already exists, skipping...`);
          skipCount++;
          continue;
        }

        // Create customer
        const customer = await Customer.create({
          id: uuidv4(),
          name: `${userData.firstname} ${userData.lastname}`,
          phone: userData.mobile,
          address: userData.address,
          whatsapp_number: userData.whatsappNumber,
          pace_user_id: userData.username,
          company_id: paceCompany.id,
          status: 'active'
        });

        // Create connection for the customer
        const connection = await Connection.create({
          id: uuidv4(),
          customer_id: customer.id,
          connection_type: userData.package,
          installation_date: new Date(userData.created_on),
          activation_date: new Date(userData.created_on),
          status: 'completed',
          company_id: paceCompany.id,
          notes: `Package: ${userData.package}, Expiration: ${userData.expiration}, PayID: ${userData.payid}`
        });

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
        }

        // Create payment record
        const payment = await Payment.create({
          id: uuidv4(),
          customer_id: customer.id,
          company_id: paceCompany.id,
          connection_id: connection.id,
          amount: userData.paymentAmount,
          payment_method: userData.paymentMethod,
          reference_number: userData.payid,
          received_by: systemUser.id,
          trx_id: `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`,
          status: userData.paymentStatus,
          notes: `Payment for ${userData.package} - ${userData.firstname} ${userData.lastname}`
        });
        paymentCount++;

        // Create recharge record
        const recharge = await Recharge.create({
          id: uuidv4(),
          customer_id: customer.id,
          company_id: paceCompany.id,
          amount: userData.paymentAmount,
          payment_method: userData.paymentMethod,
          due_date: new Date(userData.expiration),
          status: userData.paymentStatus,
          payment_date: userData.paymentStatus === 'paid' ? new Date() : null,
          notes: `Recharge for ${userData.package}`,
          package: userData.package,
          name: `${userData.firstname} ${userData.lastname}`,
          address: userData.address,
          whatsapp_number: userData.whatsappNumber
        });
        rechargeCount++;

        console.log(`✅ Created customer: ${userData.firstname} ${userData.lastname} (${userData.username}) - ${userData.city}`);
        successCount++;

        // Show progress every 100 users
        if (successCount % 100 === 0) {
          console.log(`Progress: ${successCount} users seeded successfully...`);
        }

      } catch (error) {
        console.log(`❌ Error creating user ${userData.username}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n=== COMPLETE SEEDING SUMMARY ===');
    console.log(`Total users processed: ${allUsers.length}`);
    console.log(`✅ Successfully created: ${successCount}`);
    console.log(`⚠️  Skipped (already exist): ${skipCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`💰 Payments created: ${paymentCount}`);
    console.log(`🔄 Recharges created: ${rechargeCount}`);
    console.log('\nAll users with payments and addresses have been seeded!');

    process.exit(0);
  } catch (error) {
    console.error('Fatal Error:', error);
    process.exit(1);
  }
}

seedAllUsersComplete();
