require('dotenv').config();
const sequelize = require('../config/database');
const { User } = require('../models');

// Map staff names to their actual usernames
const STAFF_PHONE_MAPPING = {
  "Mansoor Khan": { username: "mansoorkhan21", phone: "03001234567" },
  "Shawkat Ali": { username: "shawkatali41", phone: "03011234568" },
  "Muhammad Yaseen": { username: "muhammadyaseen30", phone: "03021234569" },
  "Muhammad Adil": { username: "muhammadadil11", phone: "03031234570" },
  "Jabran": { username: "jabran37", phone: "03041234571" },
  "Maaz": { username: "maaz15", phone: "03051234572" },
  "Ubaid": { username: "ubaid14", phone: "03061234573" },
  "Shakeel": { username: "shakeel51", phone: "03071234574" },
  "Alhaj": { username: "alhaj71", phone: "03081234575" },
  "Ihraq": { username: "ihraq48", phone: "03091234576" },
  "Ghafar Ali": { username: "ghafarali41", phone: "03101234577" },
  "Muhammad Awais": { username: "muhammadawais11", phone: "03111234578" },
  "Tasleem Khan": { username: "tasleemkhan44", phone: "03121234579" },
  "Muhammad Ejaz": { username: "muhammadejaz6", phone: "03131234580" }
};

async function updateStaffPhoneNumbers() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    console.log('Updating staff phone numbers...');
    
    for (const [staffName, staffData] of Object.entries(STAFF_PHONE_MAPPING)) {
      const user = await User.findOne({ where: { username: staffData.username } });
      
      if (user) {
        // Update user with phone number
        await user.update({ phone: staffData.phone });
        console.log(`✅ Updated ${staffName} - Username: ${staffData.username} - Phone: ${staffData.phone}`);
      } else {
        console.log(`❌ User not found for ${staffName} (${staffData.username})`);
      }
    }

    console.log('\n=== Phone Numbers Updated Successfully ===');
    console.log(`Staff processed: ${Object.keys(STAFF_PHONE_MAPPING).length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error updating phone numbers:', error);
    process.exit(1);
  }
}

// Run updater
updateStaffPhoneNumbers();
