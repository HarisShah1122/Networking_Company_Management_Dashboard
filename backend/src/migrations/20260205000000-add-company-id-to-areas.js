'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // First add the column without foreign key constraint
      await queryInterface.addColumn('areas', 'company_id', {
        type: Sequelize.UUID,
        allowNull: true // Start as nullable to avoid constraint issues
      });

      // Add index for better performance
      await queryInterface.addIndex('areas', ['company_id']);

      console.log('✅ Successfully added company_id column to areas table');
    } catch (error) {
      // If column already exists, just log and continue
      if (error.message.includes('Duplicate column name')) {
        console.log('ℹ️ company_id column already exists in areas table');
      } else {
        console.error('❌ Error adding company_id column:', error.message);
        throw error;
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Remove index first
      await queryInterface.removeIndex('areas', ['company_id']);
    } catch (error) {
      console.warn('Warning: Could not remove index for areas.company_id:', error.message);
    }
    
    try {
      // Remove company_id column from areas table
      await queryInterface.removeColumn('areas', 'company_id');
      console.log('✅ Successfully removed company_id column from areas table');
    } catch (error) {
      console.warn('Warning: Could not remove company_id column from areas:', error.message);
    }
  }
};
