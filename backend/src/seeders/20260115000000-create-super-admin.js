'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if super admin already exists
    const [existingUsers] = await queryInterface.sequelize.query(
      "SELECT * FROM users WHERE username = 'superadmin' OR email = 'superadmin@pace.com'"
    );

    if (existingUsers.length === 0) {
      const passwordHash = await bcrypt.hash('superadmin123', 10);
      const userId = Sequelize.Utils.toDefaultValue(Sequelize.UUIDV4());

      return queryInterface.bulkInsert('users', [{
        id: userId,
        email: 'superadmin@pace.com',
        username: 'superadmin',
        password_hash: passwordHash,
        role: 'SuperAdmin',
        status: 'active',
        company_id: null,
        created_at: new Date(),
        updated_at: new Date()
      }], {});
    } else {
      console.log('Super admin user already exists, skipping...');
      return Promise.resolve();
    }
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('users', { username: 'superadmin' }, {});
  }
};

