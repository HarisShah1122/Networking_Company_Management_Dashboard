require('dotenv').config();
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../config/database');
const { User, Area } = require('../models');

// Your valid areas
const VALID_AREAS = [
  "Katlang",
  "Katti Garhi",
  "Jamal Garhi",
  "Ghondo",
  "Babozo",
  "Shadand"
];

// Your valid staff
const VALID_STAFF = [
  {
    "name": "Mansoor Khan",
    "role": "Manager",
    "area": "Katti Garhi",
    "phone": "03001234567"
  },
  {
    "name": "Shawkat Ali",
    "role": "Technician",
    "phone": "03011234568"
  },
  {
    "name": "Muhammad Yaseen",
    "role": "Technician",
    "phone": "03021234569"
  },
  {
    "name": "Muhammad Adil",
    "role": "Technician",
    "phone": "03031234570"
  },
  {
    "name": "Jabran",
    "role": "Technician",
    "phone": "03041234571"
  },
  {
    "name": "Maaz",
    "role": "Technician",
    "phone": "03051234572"
  },
  {
    "name": "Ubaid",
    "role": "Technician",
    "area": "Babozo",
    "phone": "03061234573"
  },
  {
    "name": "Shakeel",
    "role": "Technician",
    "area": "Katlang",
    "phone": "03071234574"
  },
  {
    "name": "Alhaj",
    "role": "Technician",
    "phone": "03081234575"
  },
  {
    "name": "Ihraq",
    "role": "Technician",
    "phone": "03091234576"
  },
  {
    "name": "Ghafar Ali",
    "role": "Technician",
    "area": "Ghondo",
    "phone": "03101234577"
  },
  {
    "name": "Muhammad Awais",
    "role": "Technician",
    "phone": "03111234578"
  },
  {
    "name": "Tasleem Khan",
    "role": "Technician",
    "phone": "03121234579"
  },
  {
    "name": "Muhammad Ejaz",
    "role": "Manager",
    "area": "Jamal Garhi",
    "phone": "03131234580"
  }
];

function generateEmail(name) {
  const cleanName = name.toLowerCase().replace(/\s+/g, '.');
  return `${cleanName}@networkingcompany.com`;
}

function generateUsername(name) {
  const cleanName = name.toLowerCase().replace(/\s+/g, '');
  return cleanName + Math.floor(Math.random() * 100);
}

async function addAreasAndStaff() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    // Get the first company ID (assuming there's at least one company)
    const { User } = require('../models');
    const adminUser = await User.findOne({ where: { role: 'CEO' } });
    const companyId = adminUser?.company_id;
    
    if (!companyId) {
      console.error('No company found. Please create a company first.');
      process.exit(1);
    }
    
    console.log(`Using company ID: ${companyId}`);

    // Add valid areas (only if they don't exist)
    console.log('Adding valid areas...');
    for (const areaName of VALID_AREAS) {
      const [area, created] = await Area.findOrCreate({
        where: { name: areaName },
        defaults: {
          id: uuidv4(),
          name: areaName,
          code: areaName.toUpperCase().replace(/\s+/g, '_') + '_001',
          description: `${areaName} area - Networking Company Service Area`,
          company_id: companyId
        }
      });
      
      if (created) {
        console.log(`✅ Created area: ${areaName}`);
      } else {
        console.log(`ℹ️  Area already exists: ${areaName}`);
      }
    }

    // Add valid staff (update existing users with phone numbers)
    console.log('\nUpdating valid staff with phone numbers...');
    const staffPasswordHash = await bcrypt.hash('staff123', 10);
    
    for (const staffMember of VALID_STAFF) {
      const username = generateUsername(staffMember.name);
      const user = await User.findOne({ where: { username } });
      
      if (user) {
        // Update existing user with phone number
        await user.update({ phone: staffMember.phone });
        console.log(`✅ Updated staff: ${staffMember.name} (${staffMember.role}) - Phone: ${staffMember.phone}`);
        if (staffMember.area) {
          console.log(`   - Assigned to area: ${staffMember.area}`);
        }
      } else {
        // Create new user if doesn't exist
        const [newUser, created] = await User.findOrCreate({
          where: { username },
          defaults: {
            id: uuidv4(),
            email: generateEmail(staffMember.name),
            username: username,
            phone: staffMember.phone || null,
            password_hash: staffPasswordHash,
            role: staffMember.role === 'Manager' ? 'Manager' : 'Staff',
            status: 'active'
          }
        });
        
        if (created) {
          console.log(`✅ Created staff: ${staffMember.name} (${staffMember.role}) - Phone: ${staffMember.phone}`);
          if (staffMember.area) {
            console.log(`   - Assigned to area: ${staffMember.area}`);
          }
        }
      }
    }

    console.log('\n=== Areas and Staff Added Successfully ===');
    console.log(`Areas processed: ${VALID_AREAS.length}`);
    console.log(`Staff processed: ${VALID_STAFF.length}`);
    console.log('\nLogin Credentials:');
    console.log('Password for all staff: staff123');
    console.log('Usernames are generated automatically (e.g., mansoorkhanXX)');
    
    process.exit(0);
  } catch (error) {
    console.error('Error adding areas and staff:', error);
    process.exit(1);
  }
}

// Run seeder
addAreasAndStaff();
