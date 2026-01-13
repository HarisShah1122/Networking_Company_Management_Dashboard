'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  async up(queryInterface, Sequelize) {
    const passwordHash = await bcrypt.hash('admin123', 10);

    return queryInterface.bulkInsert('users', [{
      id: Sequelize.Utils.toDefaultValue(Sequelize.UUIDV4()), 
      email: 'ceo@company.com',
      username: 'Admin',
      password_hash: passwordHash,
      role: 'CEO',
      status: 'active',
      created_at: new Date(),
      updated_at: new Date()
    }], {});
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('users', { username: 'Admin' }, {});
  }
};
