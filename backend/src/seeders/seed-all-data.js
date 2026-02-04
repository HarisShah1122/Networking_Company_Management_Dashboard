require('dotenv').config();
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/database');
const { User, Customer, Connection, Recharge, Stock, Transaction, Complaint, Area, Payment, Company, ActivityLog } = require('../models');

// Pakistani names for seeding
const pakistaniNames = [
  { name: 'Ahmed Khan', father: 'Muhammad Khan', gender: 'male', phone: '03001234567', whatsapp: '03001234567', email: 'ahmed.khan@example.com' },
  { name: 'Fatima Ali', father: 'Ali Shah', gender: 'female', phone: '03011234568', whatsapp: '03011234568', email: 'fatima.ali@example.com' },
  { name: 'Hassan Malik', father: 'Malik Saeed', gender: 'male', phone: '03021234569', whatsapp: '03021234569', email: 'hassan.malik@example.com' },
  { name: 'Ayesha Bibi', father: 'Rashid Ahmed', gender: 'female', phone: '03031234570', whatsapp: '03031234570', email: 'ayesha.bibi@example.com' },
  { name: 'Usman Sheikh', father: 'Sheikh Ibrahim', gender: 'male', phone: '03041234571', whatsapp: '03041234571', email: 'usman.sheikh@example.com' },
  { name: 'Zainab Akhtar', father: 'Akhtar Hussain', gender: 'female', phone: '03051234572', whatsapp: '03051234572', email: 'zainab.akhtar@example.com' },
  { name: 'Bilal Yousaf', father: 'Yousaf Zaman', gender: 'male', phone: '03061234573', whatsapp: '03061234573', email: 'bilal.yousaf@example.com' },
  { name: 'Hina Noor', father: 'Noor Muhammad', gender: 'female', phone: '03071234574', whatsapp: '03071234574', email: 'hina.noor@example.com' },
  { name: 'Tariq Javed', father: 'Javed Iqbal', gender: 'male', phone: '03081234575', whatsapp: '03081234575', email: 'tariq.javed@example.com' },
  { name: 'Saba Riaz', father: 'Riaz Khan', gender: 'female', phone: '03091234576', whatsapp: '03091234576', email: 'saba.riaz@example.com' },
  { name: 'Hamza Butt', father: 'Butt Sajid', gender: 'male', phone: '03101234577', whatsapp: '03101234577', email: 'hamza.butt@example.com' },
  { name: 'Maham Rana', father: 'Rana Naeem', gender: 'female', phone: '03111234578', whatsapp: '03111234578', email: 'maham.rana@example.com' },
  { name: 'Abdullah Shah', father: 'Shid Khan', gender: 'male', phone: '03121234579', whatsapp: '03121234579', email: 'abdullah.shah@example.com' },
  { name: 'Sana Khan', father: 'Gul Khan', gender: 'female', phone: '03131234580', whatsapp: '03131234580', email: 'sana.khan@example.com' },
  { name: 'Imran Ali', father: 'Sultan Ali', gender: 'male', phone: '03141234581', whatsapp: '03141234581', email: 'imran.ali@example.com' },
  { name: 'Mariam Yousaf', father: 'Yousaf Khan', gender: 'female', phone: '03151234582', whatsapp: '03151234582', email: 'mariam.yousaf@example.com' },
  { name: 'Junaid Malik', father: 'Malik Baba', gender: 'male', phone: '03161234583', whatsapp: '03161234583', email: 'junaid.malik@example.com' },
  { name: 'Aisha Bibi', father: 'Baba Jan', gender: 'female', phone: '03171234584', whatsapp: '03171234584', email: 'aisha.bibi@example.com' },
  { name: 'Fahad Khan', father: 'Khan Baba', gender: 'male', phone: '03181234585', whatsapp: '03181234585', email: 'fahad.khan@example.com' },
  { name: 'Zahra Ali', father: 'Ali Jan', gender: 'female', phone: '03191234586', whatsapp: '03191234586', email: 'zahra.ali@example.com' }
];

const generatePakistaniNames = (count) => {
  const firstNames = ['Ahmed', 'Muhammad', 'Abdullah', 'Usman', 'Ali', 'Hassan', 'Bilal', 'Hamza', 'Junaid', 'Fahad', 'Tariq', 'Imran', 'Omar', 'Khalid', 'Zain', 'Saad', 'Yasir', 'Adnan', 'Naveed', 'Faisal'];
  const lastNames = ['Khan', 'Ali', 'Malik', 'Shah', 'Sheikh', 'Butt', 'Rana', 'Gill', 'Chaudhry', 'Qureshi', 'Siddiqui', 'Farooq', 'Mirza', 'Baig', 'Dar', 'Wani', 'Lone', 'Tantray', 'Bhat', 'Rather'];
  const fathers = ['Muhammad', 'Abdul', 'Ghulam', 'Sultan', 'Noor', 'Baba', 'Jan', 'Shah', 'Khan', 'Ali'];
  
  const names = [];
  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const fatherName = fathers[Math.floor(Math.random() * fathers.length)] + ' ' + lastNames[Math.floor(Math.random() * lastNames.length)];
    const gender = Math.random() > 0.5 ? 'male' : 'female';
    const femaleNames = ['Fatima', 'Ayesha', 'Zainab', 'Mariam', 'Aisha', 'Sana', 'Zahra', 'Hina', 'Maham', 'Saba'];
    
    if (gender === 'female') {
      names.push({
        name: femaleNames[Math.floor(Math.random() * femaleNames.length)] + ' ' + lastName,
        father: fatherName,
        gender: 'female',
        phone: '03' + Math.floor(Math.random() * 900000000 + 100000000),
        whatsapp: '03' + Math.floor(Math.random() * 900000000 + 100000000),
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 100)}@example.com`
      });
    } else {
      names.push({
        name: firstName + ' ' + lastName,
        father: fatherName,
        gender: 'male',
        phone: '03' + Math.floor(Math.random() * 900000000 + 100000000),
        whatsapp: '03' + Math.floor(Math.random() * 900000000 + 100000000),
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 100)}@example.com`
      });
    }
  }
  return names;
};

const pakistaniAddresses = [
  'House No. 123, Street 5, Katlang, Mardan',
  'Village Jalalabad, Katlang, Mardan',
  'Mohalla Kaka Khel, Katlang, Mardan',
  'Street 10, Banda Daud Shah, Katlang, Mardan',
  'Near Government School, Katlang, Mardan',
  'Village Nawan Killi, Katlang, Mardan',
  'Main Bazaar, Mardan City, Mardan',
  'University Road, Mardan City, Mardan',
  'G.T Road, Mardan City, Mardan',
  'Shahbaz Garhi Road, Mardan City, Mardan',
  'Near Railway Station, Mardan City, Mardan',
  'GT Road, Nowshera-Mardan, Mardan',
  'Takht Bhai Road, Mardan',
  'Khalaba Market, Mardan',
  'Chowk Yadgar, Mardan City',
  'Sakhi Sarwar Chowk, Mardan',
  'Baba Qasim Bypass, Mardan',
  'Nawab Market, Katlang',
  'Police Station Road, Katlang',
  'Basic Health Unit, Katlang',
  'Government College, Mardan',
  'District Hospital, Mardan',
  'Press Club, Mardan',
  'Mardan Railway Station',
  'Bus Stand, Mardan',
  'Agricultural Research Institute, Mardan',
  'Khanpur Road, Mardan',
  'Shahbaz Garhi, Mardan',
  'Takht Bhai, Mardan',
  'Rustam, Mardan',
  'Toru, Mardan'
];

const generatePakistaniAddresses = (count) => {
  const areas = ['Katlang', 'Mardan City', 'Takht Bhai', 'Rustam', 'Toru', 'Shahbaz Garhi'];
  const streetTypes = ['Street', 'Mohalla', 'Village', 'Colony', 'Housing Scheme', 'Sector'];
  const landmarks = ['Near Mosque', 'Near School', 'Main Road', 'Market Area', 'Government Office', 'Hospital Area'];
  
  const addresses = [];
  for (let i = 0; i < count; i++) {
    const area = areas[Math.floor(Math.random() * areas.length)];
    const houseNo = Math.floor(Math.random() * 999) + 1;
    const street = Math.floor(Math.random() * 50) + 1;
    const streetType = streetTypes[Math.floor(Math.random() * streetTypes.length)];
    const landmark = landmarks[Math.floor(Math.random() * landmarks.length)];
    
    addresses.push(`House No. ${houseNo}, ${streetType} ${street}, ${landmark}, ${area}, Mardan`);
  }
  return addresses;
};

const connectionTypes = ['Fiber', 'DSL', 'Wireless', 'Cable'];
const paymentMethods = ['cash', 'card', 'online', 'bank_transfer'];
const transactionCategories = ['Internet', 'Equipment', 'Installation', 'Maintenance', 'Office Rent', 'Utilities', 'Salary', 'Other'];
const stockCategories = ['Router', 'Cable', 'Connector', 'Switch', 'Modem', 'Antenna', 'Other'];

async function seedDatabase() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connected successfully');

    await sequelize.sync({ alter: false });
    console.log('Models synced');

    console.log('Clearing existing seed data...');
    // Delete in order to respect foreign key constraints
    if (Payment) {
      await Payment.destroy({ where: {}, force: true });
    }
    await Transaction.destroy({ where: {}, force: true });
    await Complaint.destroy({ where: {}, force: true });
    await Recharge.destroy({ where: {}, force: true });
    await Connection.destroy({ where: {}, force: true });
    await Customer.destroy({ where: {}, force: true });
    await Stock.destroy({ where: {}, force: true });
    await ActivityLog.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
    await Company.destroy({ where: {}, force: true });

    const existingAreas = await Area.findAll();

    console.log('Creating Areas...');
    let katlangArea = existingAreas.find(a => a.name === 'Katlang') || await Area.create({
      id: uuidv4(),
      name: 'Katlang',
      code: 'KTL-001',
      description: 'Katlang area, Mardan District'
    });

    let mardanArea = existingAreas.find(a => a.name === 'Mardan') || await Area.create({
      id: uuidv4(),
      name: 'Mardan',
      code: 'MRD-001',
      description: 'Mardan City area, Mardan District'
    });

    console.log('Areas created/found');

    // Create test companies for multi-tenant testing
    console.log('Creating Test Companies...');
    const company1 = await Company.create({
      id: uuidv4(),
      name: 'PACE Telecom Mardan',
      email: 'info@pacetelecom.com',
      company_id: `ISP-${Date.now()}-1`,
      status: 'active'
    });

    const company2 = await Company.create({
      id: uuidv4(),
      name: 'FastNet Pakistan',
      email: 'info@fastnet.com',
      company_id: `ISP-${Date.now()}-2`,
      status: 'active'
    });

    console.log('Test companies created');

    // Create CEO users for each company
    console.log('Creating Company Users...');
    const passwordHash = await bcrypt.hash('admin123', 10);
    
    const ceoUser1 = await User.create({
      id: uuidv4(),
      email: 'ceo@pacetelecom.com',
      username: 'admin',
      password_hash: passwordHash,
      role: 'CEO',
      status: 'active',
      companyId: company1.id
    });

    const ceoUser2 = await User.create({
      id: uuidv4(),
      email: 'ceo@fastnet.com',
      username: 'fastnet_admin',
      password_hash: passwordHash,
      role: 'CEO',
      status: 'active',
      companyId: company2.id
    });

    console.log('Company users created');

    console.log('Creating 200 Pakistani Customers...');
    const customers = [];
    const names = generatePakistaniNames(200);
    const addresses = generatePakistaniAddresses(200);
    
    for (let i = 0; i < 200; i++) {
      const nameData = names[i];
      const area = i < 100 ? katlangArea : mardanArea;
      const company = i < 100 ? company1 : company2;

      const customer = await Customer.create({
        id: uuidv4(),
        name: nameData.name,
        email: nameData.email,
        phone: nameData.phone.toString(),
        address: addresses[i],
        father_name: nameData.father,
        gender: nameData.gender,
        whatsapp_number: nameData.whatsapp.toString(),
        pace_user_id: `PACE-${i + 1}-${Date.now().toString().slice(-6)}`,
        area_id: area.id,
        company_id: company.id,
        status: 'active'
      });
      customers.push(customer);
      
      if ((i + 1) % 50 === 0) {
        console.log(`Created ${i + 1} customers...`);
      }
    }
    console.log(`${customers.length} customers created`);

    console.log('Creating 200 Connections...');
    const connections = [];
    for (let i = 0; i < 200; i++) {
      const customer = customers[i];
      const connectionType = connectionTypes[i % connectionTypes.length];
      const installationDate = new Date();
      installationDate.setDate(installationDate.getDate() - (30 + i % 60));
      const activationDate = new Date(installationDate);
      activationDate.setDate(activationDate.getDate() + 2);

      const connection = await Connection.create({
        id: uuidv4(),
        customer_id: customer.id,
        connection_type: connectionType,
        installation_date: installationDate.toISOString().split('T')[0],
        activation_date: activationDate.toISOString().split('T')[0],
        status: i % 4 === 0 ? 'pending' : (i % 4 === 1 ? 'completed' : (i % 4 === 2 ? 'cancelled' : 'completed')),
        company_id: i < 100 ? company1.id : company2.id,
        notes: `Connection installed in ${customer.address}`
      });
      connections.push(connection);
      
      if ((i + 1) % 50 === 0) {
        console.log(`Created ${i + 1} connections...`);
      }
    }
    console.log(`${connections.length} connections created`);

    console.log('Creating 200 Recharges...');
    const recharges = [];
    for (let i = 0; i < 200; i++) {
      const customer = customers[i];
      const amount = 1000 + (i % 10) * 500;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (i % 30) + 1);

      const recharge = await Recharge.create({
        id: uuidv4(),
        customer_id: customer.id,
        company_id: i < 100 ? company1.id : company2.id,
        amount: amount,
        payment_method: paymentMethods[i % paymentMethods.length],
        due_date: dueDate.toISOString().split('T')[0],
        status: i % 3 === 0 ? 'paid' : (i % 3 === 1 ? 'pending' : 'overdue'),
        payment_date: i % 3 === 0 ? new Date().toISOString().split('T')[0] : null,
        package: `${amount}MB Package`,
        name: customer.name,
        address: customer.address,
        whatsapp_number: customer.whatsapp_number,
        notes: `Monthly recharge for ${customer.name}`
      });
      recharges.push(recharge);
      
      if ((i + 1) % 50 === 0) {
        console.log(`Created ${i + 1} recharges...`);
      }
    }
    console.log(`${recharges.length} recharges created`);

    console.log('Creating 12 Stock Items...');
    const stockItems = [];
    for (let i = 0; i < 12; i++) {
      const category = stockCategories[i % stockCategories.length];
      const stock = await Stock.create({
        id: uuidv4(),
        name: `${category} ${i + 1}`,
        category: category,
        quantity_available: 50 + (i * 10),
        quantity_used: i * 5,
        unit_price: 500 + (i * 100),
        description: `Pakistani ${category} item for networking equipment`
      });
      stockItems.push(stock);
    }
    console.log(`${stockItems.length} stock items created`);

    console.log('Creating 12 Transactions...');
    const transactions = [];
    for (let i = 0; i < 12; i++) {
      const type = i % 2 === 0 ? 'income' : 'expense';
      const amount = type === 'income' ? 5000 + (i * 1000) : 2000 + (i * 500);
      const date = new Date();
      date.setDate(date.getDate() - i * 3);

      const transaction = await Transaction.create({
        id: uuidv4(),
        trxId: `TRX-${Date.now()}-${i}`,
        type: type,
        amount: amount,
        company_id: i < 6 ? company1.id : company2.id,
        description: `Transaction ${i + 1} - ${transactionCategories[i % transactionCategories.length]}`,
        category: transactionCategories[i % transactionCategories.length],
        date: date.toISOString().split('T')[0],
        created_by: ceoUser1.id
      });
      transactions.push(transaction);
    }
    console.log(`${transactions.length} transactions created`);

    console.log('Creating 12 Payments...');
    const payments = [];
    for (let i = 0; i < 12; i++) {
      const customer = customers[i];
      const amount = 1000 + (i * 500);
      const paymentDate = new Date();
      paymentDate.setDate(paymentDate.getDate() - i * 2);

      const payment = await Payment.create({
        id: uuidv4(),
        customer_id: customer.id,
        company_id: i < 6 ? company1.id : company2.id,
        recharge_id: recharges[i]?.id || null,
        amount: amount,
        payment_method: paymentMethods[i % paymentMethods.length],
        reference_number: `REF-${Date.now()}-${i}`,
        received_by: ceoUser1.id,
        trx_id: `PAY-${Date.now()}-${i}`,
        notes: `Payment for ${customer.name}`
      });
      payments.push(payment);
    }
    console.log(`${payments.length} payments created`);

    console.log('Creating 12 Complaints...');
    const complaints = [];
    const complaintTitles = [
      'Slow Internet Speed',
      'Connection Dropping',
      'Billing Issue',
      'Router Not Working',
      'Service Interruption',
      'Installation Delay',
      'Technical Support Needed',
      'Package Upgrade Request',
      'Payment Issue',
      'Account Problem',
      'Network Coverage Issue',
      'Customer Service Complaint'
    ];

    for (let i = 0; i < 12; i++) {
      const customer = customers[i];
      const connection = connections[i];
      const statusOptions = ['open', 'in_progress', 'on_hold', 'closed'];
      const priorityOptions = ['low', 'medium', 'high', 'urgent'];

      const complaint = await Complaint.create({
        id: uuidv4(),
        customerId: customer.id,
        connectionId: connection.id,
        title: complaintTitles[i],
        description: `Customer complaint regarding ${complaintTitles[i].toLowerCase()}. Customer details: ${customer.name}, ${customer.address}`,
        status: statusOptions[i % statusOptions.length],
        priority: priorityOptions[i % priorityOptions.length],
        name: customer.name,
        address: customer.address,
        whatsapp_number: customer.whatsapp_number,
        company_id: i < 6 ? company1.id : company2.id
      });
      complaints.push(complaint);
    }
    console.log(`${complaints.length} complaints created`);

    console.log('\n✅ Multi-Tenant Seeding completed successfully!');
    console.log('\nSummary:');
    console.log(`- Companies: 2 (PACE Telecom Mardan, FastNet Pakistan)`);
    console.log(`- Company Users: 2 CEOs`);
    console.log(`- Areas: 2 (Katlang, Mardan)`);
    console.log(`- Customers: ${customers.length} (100 per company)`);
    console.log(`- Connections: ${connections.length} (100 per company)`);
    console.log(`- Recharges: ${recharges.length} (100 per company)`);
    console.log(`- Payments: ${payments.length}`);
    console.log(`- Stock Items: ${stockItems.length}`);
    console.log(`- Transactions: ${transactions.length}`);
    console.log(`- Complaints: ${complaints.length}`);
    console.log('\n🔒 Multi-Tenant Test Data Created:');
    console.log(`- Company 1 (PACE Telecom): ${company1.name} - ID: ${company1.id}`);
    console.log(`- Company 2 (FastNet): ${company2.name} - ID: ${company2.id}`);
    console.log(`- CEO 1: admin (password: admin123)`);
    console.log(`- CEO 2: fastnet_admin (password: admin123)`);
    console.log('\nAll data seeded with proper company_id assignments for testing!');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run seeder
seedDatabase();
