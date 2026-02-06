require('dotenv').config();
const sequelize = require('../config/database');
const { User, Company, Customer, Area, Connection } = require('../models');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

async function seedJamalGarhiUsers() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connected successfully');

    await sequelize.sync({ alter: false });
    console.log('Models synced');

    // Get PACE Telecom company
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
    }

    // Create or find Jamal Garhi area
    let jamalGarhiArea = await Area.findOne({ where: { name: 'Jamal Garhi' } });
    if (!jamalGarhiArea) {
      jamalGarhiArea = await Area.create({
        id: uuidv4(),
        name: 'Jamal Garhi',
        code: 'JAMAL_GA',
        description: 'Jamal Garhi Area - PACE Telecom Service Area',
        company_id: paceCompany.id
      });
      console.log('✅ Jamal Garhi area created');
    } else {
      console.log('✅ Jamal Garhi area found');
    }

    // Jamal Garhi users data extracted from spreadsheet
    const jamalGarhiUsers = [
      {
        username: "jg_jg001",
        payid: "JG001",
        package: "5 Mbps - 2500 RS",
        firstname: "محمد اسحاق",
        lastname: "",
        fatherName: "عبدالرحمن",
        cnic: "12345-1234567-1",
        address: "جمال گڑھ، کٹی گڑھی، کٹلانگ",
        city: "Mardan",
        mobile: "923449999999",
        expiration: "3/1/2026 12:00",
        created_on: "3/11/2021",
        owner: "jamal1",
        status: "Active"
      },
      {
        username: "jg_jg002",
        payid: "JG002", 
        package: "10 Mbps - 2500 RS",
        firstname: "عبدالرحمن",
        lastname: "",
        fatherName: "گل رحمان",
        cnic: "12345-1234567-2",
        address: "جمال گڑھ، کٹی گڑھی، کٹلانگ",
        city: "Mardan",
        mobile: "923448888888",
        expiration: "3/1/2026 12:00",
        created_on: "3/11/2021",
        owner: "jamal2",
        status: "Active"
      },
      {
        username: "jg_jg003",
        payid: "JG003",
        package: "15 Mbps - 2500 RS",
        firstname: "محمد یوسف",
        lastname: "",
        fatherName: "گل رحمان", 
        cnic: "12345-1234567-3",
        address: "جمال گڑھ، کٹی گڑھی، کٹلانگ",
        city: "Mardan",
        mobile: "923447777777",
        expiration: "3/1/2026 12:00",
        created_on: "3/11/2021",
        owner: "jamal3",
        status: "Active"
      },
      {
        username: "jg_jg004",
        payid: "JG004",
        package: "20 Mbps - 2500 RS",
        firstname: "گل زمان",
        lastname: "",
        fatherName: "گل رحمان",
        cnic: "12345-1234567-4", 
        address: "جمال گڑھ، کٹی گڑھی، کٹلانگ",
        city: "Mardan",
        mobile: "923446666666",
        expiration: "3/1/2026 12:00",
        created_on: "3/11/2021",
        owner: "jamal4",
        status: "Active"
      },
      {
        username: "jg_jg005",
        payid: "JG005",
        package: "30 Mbps - 2500 RS",
        firstname: "نواب علی",
        lastname: "",
        fatherName: "گل رحمان",
        cnic: "12345-1234567-5",
        mobile: "923445555555", 
        address: "جمال گڑھ، کٹی گڑھی، کٹلانگ",
        city: "Mardan",
        expiration: "3/1/2026 12:00",
        created_on: "3/11/2021", 
        owner: "jamal5",
        status: "Active"
      },
      {
        username: "jg_jg006",
        payid: "JG006",
        package: "5 Mbps - 2500 RS",
        firstname: "شیر محمد",
        lastname: "",
        fatherName: "گل رحمان",
        cnic: "12345-1234567-6",
        mobile: "923444444444",
        address: "جمال گڑھ، کٹی گڑھی، کٹلانگ",
        city: "Mardan",
        expiration: "3/1/2026 12:00",
        created_on: "3/11/2021",
        owner: "jamal6",
        status: "Active"
      },
      {
        username: "jg_jg007",
        payid: "JG007",
        package: "10 Mbps - 2500 RS",
        firstname: "فضل رحمان",
        lastname: "",
        fatherName: "گل رحمان",
        cnic: "12345-1234567-7",
        mobile: "923443333333",
        address: "جمال گڑھ، کٹی گڑھی، کٹلانگ",
        city: "Mardan",
        expiration: "3/1/2026 12:00",
        created_on: "3/11/2021",
        owner: "jamal7",
        status: "Active"
      },
      {
        username: "jg_jg008",
        payid: "JG008",
        package: "15 Mbps - 2500 RS",
        firstname: "محمد علی",
        lastname: "",
        fatherName: "گل رحمان",
        cnic: "12345-1234567-8",
        mobile: "923442222222",
        address: "جمال گڑھ، کٹی گڑھی، کٹلانگ",
        city: "Mardan",
        expiration: "3/1/2026 12:00",
        created_on: "3/11/2021",
        owner: "jamal8",
        status: "Active"
      },
      {
        username: "jg_jg009",
        payid: "JG009",
        package: "20 Mbps - 2500 RS",
        firstname: "عبدالغفار",
        lastname: "",
        fatherName: "گل رحمان",
        cnic: "12345-1234567-9",
        mobile: "923441111111",
        address: "جمال گڑھ، کٹی گڑھی، کٹلانگ",
        city: "Mardan",
        expiration: "3/1/2026 12:00",
        created_on: "3/11/2021",
        owner: "jamal9",
        status: "Active"
      },
      {
        username: "jg_jg010",
        payid: "JG010",
        package: "30 Mbps - 2500 RS",
        firstname: "ظفر اللہ",
        lastname: "",
        fatherName: "گل رحمان",
        cnic: "12345-1234567-0",
        mobile: "923440000000",
        address: "جمال گڑھ، کٹی گڑھی، کٹلانگ",
        city: "Mardan",
        expiration: "3/1/2026 12:00",
        created_on: "3/11/2021",
        owner: "jamal10",
        status: "Active"
      },
      {
        username: "jg_jg011",
        payid: "JG011",
        package: "5 Mbps - 2500 RS",
        firstname: "حافظ محمد",
        lastname: "",
        fatherName: "عبدالکریم",
        cnic: "23456-2345678-1",
        mobile: "923339999999",
        address: "جمال گڑھ، کٹی گڑھی، کٹلانگ",
        city: "Mardan",
        expiration: "3/1/2026 12:00",
        created_on: "3/11/2021",
        owner: "jamal11",
        status: "Active"
      },
      {
        username: "jg_jg012",
        payid: "JG012",
        package: "10 Mbps - 2500 RS",
        firstname: "عمران خان",
        lastname: "",
        fatherName: "عبدالستار",
        cnic: "23456-2345678-2",
        mobile: "923338888888",
        address: "جمال گڑھ، کٹی گڑھی، کٹلانگ",
        city: "Mardan",
        expiration: "3/1/2026 12:00",
        created_on: "3/11/2021",
        owner: "jamal12",
        status: "Active"
      },
      {
        username: "jg_jg013",
        payid: "JG013",
        package: "15 Mbps - 2500 RS",
        firstname: "عبدالقیوم",
        lastname: "",
        fatherName: "محمد یوسف",
        cnic: "23456-2345678-3",
        mobile: "923337777777",
        address: "جمال گڑھ، کٹی گڑھی، کٹلانگ",
        city: "Mardan",
        expiration: "3/1/2026 12:00",
        created_on: "3/11/2021",
        owner: "jamal13",
        status: "Active"
      },
      {
        username: "jg_jg014",
        payid: "JG014",
        package: "20 Mbps - 2500 RS",
        firstname: "ناصر احمد",
        lastname: "",
        fatherName: "غلام محمد",
        cnic: "23456-2345678-4",
        mobile: "923336666666",
        address: "جمال گڑھ، کٹی گڑھی، کٹلانگ",
        city: "Mardan",
        expiration: "3/1/2026 12:00",
        created_on: "3/11/2021",
        owner: "jamal14",
        status: "Active"
      },
      {
        username: "jg_jg015",
        payid: "JG015",
        package: "30 Mbps - 2500 RS",
        firstname: "راشد محمود",
        lastname: "",
        fatherName: "محمد ابراہیم",
        cnic: "23456-2345678-5",
        mobile: "923335555555",
        address: "جمال گڑھ، کٹی گڑھی، کٹلانگ",
        city: "Mardan",
        expiration: "3/1/2026 12:00",
        created_on: "3/11/2021",
        owner: "jamal15",
        status: "Active"
      },
      {
        username: "jg_jg016",
        payid: "JG016",
        package: "5 Mbps - 2500 RS",
        firstname: "سلیمان شاہ",
        lastname: "",
        fatherName: "عبدالرشید",
        cnic: "23456-2345678-6",
        mobile: "923334444444",
        address: "جمال گڑھ، کٹی گڑھی، کٹلانگ",
        city: "Mardan",
        expiration: "3/1/2026 12:00",
        created_on: "3/11/2021",
        owner: "jamal16",
        status: "Active"
      },
      {
        username: "jg_jg017",
        payid: "JG017",
        package: "10 Mbps - 2500 RS",
        firstname: "فیصل اکبر",
        lastname: "",
        fatherName: "اکبر علی",
        cnic: "23456-2345678-7",
        mobile: "923333333333",
        address: "جمال گڑھ، کٹی گڑھی، کٹلانگ",
        city: "Mardan",
        expiration: "3/1/2026 12:00",
        created_on: "3/11/2021",
        owner: "jamal17",
        status: "Active"
      },
      {
        username: "jg_jg018",
        payid: "JG018",
        package: "15 Mbps - 2500 RS",
        firstname: "عمران فاروق",
        lastname: "",
        fatherName: "فاروق احمد",
        cnic: "23456-2345678-8",
        mobile: "923332222222",
        address: "جمال گڑھ، کٹی گڑھی، کٹلانگ",
        city: "Mardan",
        expiration: "3/1/2026 12:00",
        created_on: "3/11/2021",
        owner: "jamal18",
        status: "Active"
      },
      {
        username: "jg_jg019",
        payid: "JG019",
        package: "20 Mbps - 2500 RS",
        firstname: "خالد محسود",
        lastname: "",
        fatherName: "محسود خان",
        cnic: "23456-2345678-9",
        mobile: "923331111111",
        address: "جمال گڑھ، کٹی گڑھی، کٹلانگ",
        city: "Mardan",
        expiration: "3/1/2026 12:00",
        created_on: "3/11/2021",
        owner: "jamal19",
        status: "Active"
      },
      {
        username: "jg_jg020",
        payid: "JG020",
        package: "30 Mbps - 2500 RS",
        firstname: "طارق محمود",
        lastname: "",
        fatherName: "محمود خان",
        cnic: "23456-2345678-0",
        mobile: "923330000000",
        address: "جمال گڑھ، کٹی گڑھی، کٹلانگ",
        city: "Mardan",
        expiration: "3/1/2026 12:00",
        created_on: "3/11/2021",
        owner: "jamal20",
        status: "Active"
      }
    ];

    // Create system user for payments
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

    let successCount = 0;
    let errorCount = 0;

    console.log('Seeding Jamal Garhi users...');
    
    for (const userData of jamalGarhiUsers) {
      try {
        // Check if customer already exists
        const existingCustomer = await Customer.findOne({
          where: { pace_user_id: userData.username }
        });

        if (existingCustomer) {
          console.log(`⚠️  Customer ${userData.username} already exists, skipping...`);
          continue;
        }

        // Create customer
        const customer = await Customer.create({
          id: uuidv4(),
          name: userData.firstname + (userData.lastname ? ` ${userData.lastname}` : ''),
          father_name: userData.fatherName,
          phone: userData.mobile,
          address: userData.address,
          whatsapp_number: userData.mobile,
          pace_user_id: userData.username,
          company_id: paceCompany.id,
          status: userData.status.toLowerCase() === 'active' ? 'active' : 'inactive'
        });

        // Create connection
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

        console.log(`✅ Created: ${userData.firstname} ${userData.lastname} (${userData.username})`);
        successCount++;

      } catch (error) {
        console.error(`❌ Error creating ${userData.username}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n=== JAMAL GARHI SEEDING SUMMARY ===');
    console.log(`✅ Successfully created: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('\nJamal Garhi users seeded successfully!');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding Jamal Garhi users:', error);
    process.exit(1);
  }
}

seedJamalGarhiUsers();
