'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Check if area_id column already exists
      const tableDescription = await queryInterface.describeTable('customers');
      
      if (!tableDescription.area_id) {
        await queryInterface.addColumn('customers', 'area_id', {
          type: Sequelize.UUID,
          allowNull: true,
          field: 'area_id'
        });
        console.log('✅ Added area_id column to customers table');
      } else {
        console.log('ℹ️ area_id column already exists in customers table');
      }
    } catch (error) {
      console.error('❌ Failed to add area_id column:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('customers', 'area_id');
      console.log('✅ Removed area_id column from customers table');
    } catch (error) {
      console.error('❌ Failed to remove area_id column:', error);
      throw error;
    }
  }
};
