'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add phone column to users table
    await queryInterface.addColumn('users', 'phone', {
      type: Sequelize.STRING(20),
      allowNull: true,
      after: 'username'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove phone column from users table
    await queryInterface.removeColumn('users', 'phone');
  }
};
