require('dotenv').config();
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../src/config/database');
const { User, Customer, Connection, Recharge, Stock, Transaction, Complaint, Area, Payment } = require('../src/models');

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
  { name: 'Maham Rana', father: 'Rana Naeem', gender: 'female', phone: '03111234578', whatsapp: '03111234578', email: 'maham.rana@example.com' }
];

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
  'GT Road, Nowshera-Mardan, Mardan'
];

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

    const existingAreas = await Area.findAll();
    const existingUsers = await User.findAll();

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

    let ceoUser = existingUsers.find(u => u.role === 'CEO');
    if (!ceoUser) {
      const passwordHash = await bcrypt.hash('admin123', 10);
      ceoUser = await User.create({
        id: uuidv4(),
        email: 'ceo@company.com',
        username: 'admin',
        password_hash: passwordHash,
        role: 'CEO',
        status: 'active'
      });
      console.log('CEO user created');
    } else {
      console.log('CEO user already exists');
    }

    console.log('Creating 12 Pakistani Customers...');
    const customers = [];
    for (let i = 0; i < 12; i++) {
      const nameData = pakistaniNames[i];
      const area = i < 6 ? katlangArea : mardanArea;

      const customer = await Customer.create({
        id: uuidv4(),
        name: nameData.name,
        email: nameData.email,
        phone: nameData.phone,
        address: pakistaniAddresses[i],
        father_name: nameData.father,
        gender: nameData.gender,
        whatsapp_number: nameData.whatsapp,
        areaId: area.id,
        status: 'active'
      });
      customers.push(customer);
    }
    console.log(`${customers.length} customers created`);

    console.log('Creating 12 Connections...');
    const connections = [];
    for (let i = 0; i < 12; i++) {
      const customer = customers[i];
      const connectionType = connectionTypes[i % connectionTypes.length];
      const installationDate = new Date();
      installationDate.setDate(installationDate.getDate() - (30 + i * 10));
      const activationDate = new Date(installationDate);
      activationDate.setDate(activationDate.getDate() + 2);

      const connection = await Connection.create({
        id: uuidv4(),
        customer_id: customer.id,
        connection_type: connectionType,
        installation_date: installationDate.toISOString().split('T')[0],
        activation_date: activationDate.toISOString().split('T')[0],
        status: i % 4 === 0 ? 'pending' : 'completed',
        notes: `Connection installed in ${customer.address}`
      });
      connections.push(connection);
    }
    console.log(`${connections.length} connections created`);

    console.log('Creating 12 Recharges...');
    const recharges = [];
    for (let i = 0; i < 12; i++) {
      const customer = customers[i];
      const amount = 1000 + (i * 500);
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (i + 1) * 7);

      const recharge = await Recharge.create({
        id: uuidv4(),
        customer_id: customer.id,
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
        trxId: `TRX-${Date.now()}-${i}`, // <-- Fixed trxId
        type: type,
        amount: amount,
        description: `Transaction ${i + 1} - ${transactionCategories[i % transactionCategories.length]}`,
        category: transactionCategories[i % transactionCategories.length],
        date: date.toISOString().split('T')[0],
        created_by: ceoUser.id
      });
      transactions.push(transaction);
    }
    console.log(`${transactions.length} transactions created`);

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
        whatsapp_number: customer.whatsapp_number
      });
      complaints.push(complaint);
    }
    console.log(`${complaints.length} complaints created`);

    console.log('\n✅ Seeding completed successfully!');
    console.log('\nSummary:');
    console.log(`- Areas: 2 (Katlang, Mardan)`);
    console.log(`- Customers: ${customers.length}`);
    console.log(`- Connections: ${connections.length}`);
    console.log(`- Recharges: ${recharges.length}`);
    console.log(`- Stock Items: ${stockItems.length}`);
    console.log(`- Transactions: ${transactions.length}`);
    console.log(`- Complaints: ${complaints.length}`);
    console.log('\nAll data seeded with Pakistani users from Katlang and Mardan areas!');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run seeder
seedDatabase();
