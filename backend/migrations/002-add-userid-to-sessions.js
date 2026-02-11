'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add userId column to sessions table
    await queryInterface.addColumn('sessions', 'userId', {
      type: Sequelize.STRING,
      allowNull: true
    });

    // Add index for userId
    await queryInterface.addIndex('sessions', ['userId']);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove index
    await queryInterface.removeIndex('sessions', ['userId']);
    
    // Remove userId column
    await queryInterface.removeColumn('sessions', 'userId');
  }
};
