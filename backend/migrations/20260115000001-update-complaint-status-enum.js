'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Update complaint status enum to include 'on_hold' instead of 'resolved'
    await queryInterface.sequelize.query(`
      ALTER TABLE complaints MODIFY COLUMN status ENUM('open', 'in_progress', 'on_hold', 'closed') DEFAULT 'open';
    `);
  },

  async down(queryInterface, Sequelize) {
    // Revert back to original enum
    await queryInterface.sequelize.query(`
      ALTER TABLE complaints MODIFY COLUMN status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open';
    `);
  }
};

