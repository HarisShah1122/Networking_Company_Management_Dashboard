require('dotenv').config();
const sequelize = require('../config/database');
const { User } = require('../models');

// Your valid staff with phone numbers
const VALID_STAFF = [
  {
    "name": "Mansoor Khan",
    "phone": "03001234567"
  },
  {
    "name": "Shawkat Ali",
    "phone": "03011234568"
  },
  {
    "name": "Muhammad Yaseen",
    "phone": "03021234569"
  },
  {
    "name": "Muhammad Adil",
    "phone": "03031234570"
  },
  {
    "name": "Jabran",
    "phone": "03041234571"
  },
  {
    "name": "Maaz",
    "phone": "03051234572"
  },
  {
    "name": "Ubaid",
    "phone": "03061234573"
  },
  {
    "name": "Shakeel",
    "phone": "03071234574"
  },
  {
    "name": "Alhaj",
    "phone": "03081234575"
  },
  {
    "name": "Ihraq",
    "phone": "03091234576"
  },
  {
    "name": "Ghafar Ali",
    "phone": "03101234577"
  },
  {
    "name": "Muhammad Awais",
    "phone": "03111234578"
  },
  {
    "name": "Tasleem Khan",
    "phone": "03121234579"
  },
  {
    "name": "Muhammad Ejaz",
    "phone": "03131234580"
  }
];

function generateUsername(name) {
  const cleanName = name.toLowerCase().replace(/\s+/g, '');
  return cleanName + Math.floor(Math.random() * 100);
}

async function updateStaffPhoneNumbers() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    console.log('Updating staff phone numbers...');
    
    for (const staffMember of VALID_STAFF) {
      const username = generateUsername(staffMember.name);
      
      // Try different username variations to find the user
      const possibleUsernames = [
        username,
        username + Math.floor(Math.random() * 10),
        username + Math.floor(Math.random() * 20)
      ];
      
      let user = null;
      for (const possibleUsername of possibleUsernames) {
        user = await User.findOne({ where: { username: possibleUsername } });
        if (user) {
          console.log(`Found user: ${user.username} for ${staffMember.name}`);
          break;
        }
      }
      
      if (user) {
        // Update user with phone number
        await user.update({ phone: staffMember.phone });
        console.log(`✅ Updated ${staffMember.name} - Phone: ${staffMember.phone}`);
      } else {
        console.log(`❌ User not found for ${staffMember.name}`);
      }
    }

    console.log('\n=== Phone Numbers Updated Successfully ===');
    console.log(`Staff processed: ${VALID_STAFF.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error updating phone numbers:', error);
    process.exit(1);
  }
}

// Run updater
updateStaffPhoneNumbers();
