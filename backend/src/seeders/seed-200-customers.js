require('dotenv').config();
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../src/config/database');
const { User, Customer, Connection, Recharge, Stock, Transaction, Complaint, Area, Payment } = require('../src/models');

const pakistaniFirstNames = [
  'Ahmed', 'Muhammad', 'Abdullah', 'Umar', 'Ali', 'Hassan', 'Hussain', 'Bilal', 'Hamza', 'Usman',
  'Tariq', 'Khalid', 'Saif', 'Imran', 'Nadeem', 'Shahid', 'Fahad', 'Zain', 'Haroon', 'Junaid',
  'Sajid', 'Waqas', 'Adnan', 'Kamran', 'Faisal', 'Zeeshan', 'Asif', 'Javed', 'Irfan', 'Yasir',
  'Rashid', 'Akbar', 'Sultan', 'Gul', 'Nawab', 'Malik', 'Sheikh', 'Chaudhry', 'Khan', 'Yousaf',
  'Ibrahim', 'Ismail', 'Yaqoob', 'Younis', 'Ayub', 'Dawood', 'Suleman', 'Musa', 'Haroon', 'Zakaria',
  'Fatima', 'Ayesha', 'Khadija', 'Aisha', 'Maryam', 'Zainab', 'Sakina', 'Aliya', 'Sadia', 'Hina',
  'Maham', 'Kiran', 'Sana', 'Aqsa', 'Nimra', 'Zara', 'Alishba', 'Hania', 'Anum', 'Iqra',
  'Sumaira', 'Rabia', 'Sidra', 'Bushra', 'Gulnaz', 'Parveen', 'Naseem', 'Shabana', 'Rukhsana', 'Nazia'
];

const pakistaniLastNames = [
  'Khan', 'Shah', 'Ahmed', 'Ali', 'Hussain', 'Malik', 'Sheikh', 'Butt', 'Raja', 'Chaudhry',
  'Gujjar', 'Mughal', 'Pathan', 'Tanoli', 'Yousafzai', 'Khattak', 'Bangash', 'Wazir', 'Afridi', 'Orakzai',
  'Mehsud', 'Wazir', 'Marwat', 'Bhatti', 'Siddiqui', 'Farooqi', 'Usmani', 'Qureshi', 'Ansari', 'Hashmi',
  'Gilani', 'Bukhari', 'Naqvi', 'Rizvi', 'Zaidi', 'Taqui', 'Kazmi', 'Naqvi', 'Abidi', 'Mujtaba'
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
  'GT Road, Nowshera-Mardan, Mardan',
  'Sector A, Mardan City, Mardan',
  'Sector B, Mardan City, Mardan',
  'Sector C, Mardan City, Mardan',
  'Sector D, Mardan City, Mardan',
  'Sector E, Mardan City, Mardan',
  'Sector F, Mardan City, Mardan',
  'Sector G, Mardan City, Mardan',
  'Sector H, Mardan City, Mardan',
  'Village Takht Bhai, Mardan',
  'Village Rustam, Mardan',
  'Village Lund Khwar, Mardan',
  'Village Sawaldher, Mardan',
  'Village Ghari Kapura, Mardan',
  'Village Tazagram, Mardan',
  'Village Khazana, Mardan',
  'Village Saro Shah, Mardan',
  'Village Babu Banda, Mardan',
  'Village Koto, Mardan',
  'Village Mangal Tara, Mardan',
  'Village Garhi Kapura, Mardan',
  'Village Shamshi Khan, Mardan',
  'Village Katlang Bala, Mardan',
  'Village Katlang Payan, Mardan',
  'Village Sherdarra, Mardan',
  'Village Mathra, Mardan',
  'Village Toru, Mardan',
  'Village Hoti, Mardan',
  'Village Rashakai, Mardan',
  'Village Amazo, Mardan',
  'Village Dheri Zardad, Mardan',
  'Village Hujra Shah, Mardan',
  'Village Pirano Dagi, Mardan',
  'Village Sheikh Baba, Mardan',
  'Village Mian Baba, Mardan',
  'Village Kaga Wala, Mardan',
  'Village Baghicha, Mardan',
  'Village Charsadda Road, Mardan',
  'Village Pirsabaq, Mardan',
  'Village Nabi, Mardan',
  'Village Sher Garh, Mardan',
  'Village Katlang Khas, Mardan',
  'Village Mamdher, Mardan',
  'Village Shewa, Mardan',
  'Village Palai, Mardan',
  'Village Sro Bala, Mardan',
  'Village Sro Payan, Mardan',
  'Village Jabar, Mardan',
  'Village Gujar Garhi, Mardan',
  'Village Babuzai, Mardan',
  'Village Kalu Khan, Mardan',
  'Village Ismaila, Mardan',
  'Village Katlang Tehsil, Mardan',
  'Village Mardan Tehsil, Mardan',
  'Village Takht Bhai Tehsil, Mardan',
  'Village Rustam Tehsil, Mardan',
  'Village Lund Khwar Tehsil, Mardan',
  'Village Sawaldher Tehsil, Mardan',
  'Village Ghari Kapura Tehsil, Mardan',
  'Village Tazagram Tehsil, Mardan',
  'Village Khazana Tehsil, Mardan',
  'Village Saro Shah Tehsil, Mardan',
  'Village Babu Banda Tehsil, Mardan',
  'Village Koto Tehsil, Mardan',
  'Village Mangal Tara Tehsil, Mardan',
  'Village Garhi Kapura Tehsil, Mardan',
  'Village Shamshi Khan Tehsil, Mardan',
  'Village Katlang Bala Tehsil, Mardan',
  'Village Katlang Payan Tehsil, Mardan',
  'Village Sherdarra Tehsil, Mardan',
  'Village Mathra Tehsil, Mardan',
  'Village Toru Tehsil, Mardan',
  'Village Hoti Tehsil, Mardan',
  'Village Rustam Colony, Mardan',
  'Village Sheikh Malam, Mardan',
  'Village Kaga Wala Colony, Mardan',
  'Village Baghicha Colony, Mardan',
  'Village Charsadda Road Colony, Mardan',
  'Village Pirsabaq Colony, Mardan',
  'Village Nabi Colony, Mardan',
  'Village Sher Garh Colony, Mardan',
  'Village Katlang Khas Colony, Mardan',
  'Village Mamdher Colony, Mardan',
  'Village Shewa Colony, Mardan',
  'Village Palai Colony, Mardan',
  'Village Sro Bala Colony, Mardan',
  'Village Sro Payan Colony, Mardan',
  'Village Jabar Colony, Mardan',
  'Village Gujar Garhi Colony, Mardan',
  'Village Babuzai Colony, Mardan',
  'Village Kalu Khan Colony, Mardan',
  'Village Ismaila Colony, Mardan',
  'Village Katlang Tehsil Colony, Mardan',
  'Village Mardan Tehsil Colony, Mardan',
  'Village Takht Bhai Tehsil Colony, Mardan',
  'Village Rustam Tehsil Colony, Mardan',
  'Village Lund Khwar Tehsil Colony, Mardan',
  'Village Sawaldher Tehsil Colony, Mardan',
  'Village Ghari Kapura Tehsil Colony, Mardan',
  'Village Tazagram Tehsil Colony, Mardan',
  'Village Khazana Tehsil Colony, Mardan',
  'Village Saro Shah Tehsil Colony, Mardan',
  'Village Babu Banda Tehsil Colony, Mardan',
  'Village Koto Tehsil Colony, Mardan',
  'Village Mangal Tara Tehsil Colony, Mardan',
  'Village Garhi Kapura Tehsil Colony, Mardan',
  'Village Shamshi Khan Tehsil Colony, Mardan',
  'Village Katlang Bala Tehsil Colony, Mardan',
  'Village Katlang Payan Tehsil Colony, Mardan',
  'Village Sherdarra Tehsil Colony, Mardan',
  'Village Mathra Tehsil Colony, Mardan',
  'Village Toru Tehsil Colony, Mardan',
  'Village Hoti Tehsil Colony, Mardan',
  'Village Rustam Colony Extension, Mardan',
  'Village Sheikh Malam Extension, Mardan',
  'Village Kaga Wala Extension, Mardan',
  'Village Baghicha Extension, Mardan',
  'Village Charsadda Road Extension, Mardan',
  'Village Pirsabaq Extension, Mardan',
  'Village Nabi Extension, Mardan',
  'Village Sher Garh Extension, Mardan',
  'Village Katlang Khas Extension, Mardan',
  'Village Mamdher Extension, Mardan',
  'Village Shewa Extension, Mardan',
  'Village Palai Extension, Mardan',
  'Village Sro Bala Extension, Mardan',
  'Village Sro Payan Extension, Mardan',
  'Village Jabar Extension, Mardan',
  'Village Gujar Garhi Extension, Mardan',
  'Village Babuzai Extension, Mardan',
  'Village Kalu Khan Extension, Mardan',
  'Village Ismaila Extension, Mardan',
  'Village Katlang Tehsil Extension, Mardan',
  'Village Mardan Tehsil Extension, Mardan',
  'Village Takht Bhai Tehsil Extension, Mardan',
  'Village Rustam Tehsil Extension, Mardan',
  'Village Lund Khwar Tehsil Extension, Mardan',
  'Village Sawaldher Tehsil Extension, Mardan',
  'Village Ghari Kapura Tehsil Extension, Mardan',
  'Village Tazagram Tehsil Extension, Mardan',
  'Village Khazana Tehsil Extension, Mardan',
  'Village Saro Shah Tehsil Extension, Mardan',
  'Village Babu Banda Tehsil Extension, Mardan',
  'Village Koto Tehsil Extension, Mardan',
  'Village Mangal Tara Tehsil Extension, Mardan',
  'Village Garhi Kapura Tehsil Extension, Mardan',
  'Village Shamshi Khan Tehsil Extension, Mardan',
  'Village Katlang Bala Tehsil Extension, Mardan',
  'Village Katlang Payan Tehsil Extension, Mardan',
  'Village Sherdarra Tehsil Extension, Mardan',
  'Village Mathra Tehsil Extension, Mardan',
  'Village Toru Tehsil Extension, Mardan',
  'Village Hoti Tehsil Extension, Mardan'
];

const connectionTypes = ['Fiber', 'DSL', 'Wireless', 'Cable'];
const paymentMethods = ['cash', 'card', 'online', 'bank_transfer'];
const transactionCategories = ['Internet', 'Equipment', 'Installation', 'Maintenance', 'Office Rent', 'Utilities', 'Salary', 'Other'];
const stockCategories = ['Router', 'Cable', 'Connector', 'Switch', 'Modem', 'Antenna', 'Other'];

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generatePakistaniName() {
  const firstName = getRandomElement(pakistaniFirstNames);
  const lastName = getRandomElement(pakistaniLastNames);
  return `${firstName} ${lastName}`;
}

function generatePakistaniFatherName() {
  const firstName = getRandomElement(pakistaniFirstNames);
  const lastName = getRandomElement(pakistaniLastNames);
  return `${firstName} ${lastName}`;
}

function generatePhoneNumber() {
  const prefixes = ['0300', '0301', '0302', '0303', '0304', '0305', '0306', '0307', '0308', '0309', '0310', '0311', '0312', '0313', '0314', '0315', '0316', '0317', '0318', '0319', '0320', '0321', '0322', '0323', '0324', '0325', '0326', '0327', '0328', '0329'];
  const prefix = getRandomElement(prefixes);
  const suffix = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  return prefix + suffix;
}

function generateEmail(name, index) {
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com'];
  const cleanName = name.toLowerCase().replace(/\s+/g, '.');
  const domain = getRandomElement(domains);
  return `${cleanName}.${index}@${domain}`;
}

function generatePaceUserId(index) {
  return `PACE-${String(index + 1).padStart(6, '0')}`;
}

async function seedDatabase() {
  try {
    await sequelize.authenticate();

    await sequelize.sync({ alter: false });

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
    } else {
    }

    const customers = [];
    for (let i = 0; i < 200; i++) {
      const name = generatePakistaniName();
      const fatherName = generatePakistaniFatherName();
      const phone = generatePhoneNumber();
      const whatsapp = generatePhoneNumber();
      const email = generateEmail(name, i);
      const address = getRandomElement(pakistaniAddresses);
      const area = i < 100 ? katlangArea : mardanArea;
      const gender = Math.random() > 0.5 ? 'male' : 'female';
      const paceUserId = generatePaceUserId(i);

      const customer = await Customer.create({
        id: uuidv4(),
        name: name,
        email: email,
        phone: phone,
        address: address,
        father_name: fatherName,
        gender: gender,
        whatsapp_number: whatsapp,
        pace_user_id: paceUserId,
        area_id: area.id,
        status: 'active'
      });
      customers.push(customer);
    }

    const connections = [];
    for (let i = 0; i < 200; i++) {
      const customer = customers[i];
      const connectionType = getRandomElement(connectionTypes);
      const installationDate = new Date();
      installationDate.setDate(installationDate.getDate() - Math.floor(Math.random() * 365));
      const activationDate = new Date(installationDate);
      activationDate.setDate(activationDate.getDate() + Math.floor(Math.random() * 7));

      const connection = await Connection.create({
        id: uuidv4(),
        customer_id: customer.id,
        connection_type: connectionType,
        installation_date: installationDate.toISOString().split('T')[0],
        activation_date: activationDate.toISOString().split('T')[0],
        status: Math.random() > 0.2 ? 'completed' : 'pending',
        notes: `Connection installed in ${customer.address}`
      });
      connections.push(connection);
    }

    const recharges = [];
    for (let i = 0; i < 200; i++) {
      const customer = customers[i];
      const amount = 500 + Math.floor(Math.random() * 5000);
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 60));
      const statusOptions = ['paid', 'pending', 'overdue'];
      const status = getRandomElement(statusOptions);

      const recharge = await Recharge.create({
        id: uuidv4(),
        customer_id: customer.id,
        amount: amount,
        payment_method: getRandomElement(paymentMethods),
        due_date: dueDate.toISOString().split('T')[0],
        status: status,
        payment_date: status === 'paid' ? new Date().toISOString().split('T')[0] : null,
        package: `${amount}MB Package`,
        name: customer.name,
        address: customer.address,
        whatsapp_number: customer.whatsapp_number,
        notes: `Monthly recharge for ${customer.name}`
      });
      recharges.push(recharge);
    }

    const stockItems = [];
    for (let i = 0; i < 50; i++) {
      const category = getRandomElement(stockCategories);
      const stock = await Stock.create({
        id: uuidv4(),
        name: `${category} ${i + 1}`,
        category: category,
        quantity_available: 50 + Math.floor(Math.random() * 200),
        quantity_used: Math.floor(Math.random() * 50),
        unit_price: 500 + Math.floor(Math.random() * 2000),
        description: `Pakistani ${category} item for networking equipment`
      });
      stockItems.push(stock);
    }

    const transactions = [];
    for (let i = 0; i < 100; i++) {
      const type = Math.random() > 0.5 ? 'income' : 'expense';
      const amount = 1000 + Math.floor(Math.random() * 10000);
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 365));

      const transaction = await Transaction.create({
        id: uuidv4(),
        trxId: `TRX-${Date.now()}-${i}`,
        type: type,
        amount: amount,
        description: `Transaction ${i + 1} - ${getRandomElement(transactionCategories)}`,
        category: getRandomElement(transactionCategories),
        date: date.toISOString().split('T')[0],
        created_by: ceoUser.id
      });
      transactions.push(transaction);
    }

    const complaints = [];
    const complaintTitles = [
      'Slow Internet Speed', 'Connection Dropping', 'Billing Issue', 'Router Not Working',
      'Service Interruption', 'Installation Delay', 'Technical Support Needed',
      'Package Upgrade Request', 'Payment Issue', 'Account Problem', 'Network Coverage Issue',
      'Customer Service Complaint', 'No Internet Connection', 'Poor Signal Quality',
      'Equipment Malfunction', 'Service Termination', 'Refund Request', 'Contract Dispute',
      'Technical Problem', 'Service Quality Issue'
    ];

    for (let i = 0; i < 100; i++) {
      const customer = customers[i];
      const connection = connections[i];
      const statusOptions = ['open', 'in_progress', 'on_hold', 'closed'];
      const priorityOptions = ['low', 'medium', 'high', 'urgent'];

      const complaint = await Complaint.create({
        id: uuidv4(),
        customerId: customer.id,
        connectionId: connection.id,
        title: getRandomElement(complaintTitles),
        description: `Customer complaint regarding ${getRandomElement(complaintTitles).toLowerCase()}. Customer details: ${customer.name}, ${customer.address}`,
        status: getRandomElement(statusOptions),
        priority: getRandomElement(priorityOptions),
        name: customer.name,
        address: customer.address,
        whatsapp_number: customer.whatsapp_number
      });
      complaints.push(complaint);
    }


    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

seedDatabase();
