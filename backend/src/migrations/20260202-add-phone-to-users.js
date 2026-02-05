'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if phone column exists in users table
    const [phoneColumn] = await queryInterface.sequelize.query(
      "SHOW COLUMNS FROM users LIKE 'phone'"
    );
    if (phoneColumn.length === 0) {
      // Add phone column to users table
      await queryInterface.addColumn('users', 'phone', {
        type: Sequelize.STRING(20),
        allowNull: true,
        after: 'username'
      });
    }
  },

  async down(queryInterface, Sequelize) {
    // Only remove phone column if it exists
    try {
      const [phoneColumn] = await queryInterface.sequelize.query(
        "SHOW COLUMNS FROM users LIKE 'phone'"
      );
      if (phoneColumn.length > 0) {
        // Remove phone column from users table
        await queryInterface.removeColumn('users', 'phone');
      }
    } catch (error) {
      console.warn('Warning: Could not remove phone column:', error.message);
    }
  }
};
