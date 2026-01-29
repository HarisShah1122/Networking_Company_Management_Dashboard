'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if admin user already exists
    const [existingUsers] = await queryInterface.sequelize.query(
      "SELECT * FROM users WHERE username = 'Admin' OR email = 'ceo@company.com'"
    );

    if (existingUsers.length === 0) {
      const passwordHash = await bcrypt.hash('admin123', 10);
      const userId = Sequelize.Utils.toDefaultValue(Sequelize.UUIDV4());

      return queryInterface.bulkInsert('users', [{
        id: userId,
        email: 'ceo@company.com',
        username: 'Admin',
        password_hash: passwordHash,
        role: 'CEO',
        status: 'active',
        company_id: null,
        created_at: new Date(),
        updated_at: new Date()
      }], {});
    } else {
      console.log('Admin user already exists, skipping...');
      return Promise.resolve();
    }
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('users', { username: 'Admin' }, {});
  }
};
