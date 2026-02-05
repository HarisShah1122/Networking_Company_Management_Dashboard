'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // First update any existing NULL company_id values to a default value
      await queryInterface.sequelize.query(`
        UPDATE areas 
        SET company_id = (
          SELECT company_id 
          FROM users 
          WHERE role IN ('CEO', 'Manager') 
          LIMIT 1
        ) 
        WHERE company_id IS NULL
      `);

      // Now make the column NOT NULL
      await queryInterface.changeColumn('areas', 'company_id', {
        type: Sequelize.UUID,
        allowNull: false
      });

      console.log('✅ Successfully made company_id NOT NULL in areas table');
    } catch (error) {
      console.error('❌ Error updating company_id constraint:', error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Make the column nullable again
      await queryInterface.changeColumn('areas', 'company_id', {
        type: Sequelize.UUID,
        allowNull: true
      });

      console.log('✅ Successfully made company_id nullable again in areas table');
    } catch (error) {
      console.error('❌ Error reverting company_id constraint:', error.message);
      throw error;
    }
  }
};
