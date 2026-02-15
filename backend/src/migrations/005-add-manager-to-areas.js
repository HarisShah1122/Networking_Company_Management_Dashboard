'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('areas', 'manager_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });

      // Add index for better performance
      await queryInterface.addIndex('areas', ['manager_id']);
      
      console.log('✅ Added manager_id column to areas table');
    } catch (error) {
      console.error('❌ Error adding manager_id column:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeIndex('areas', ['manager_id']);
      await queryInterface.removeColumn('areas', 'manager_id');
      console.log('✅ Removed manager_id column from areas table');
    } catch (error) {
      console.error('❌ Error removing manager_id column:', error);
      throw error;
    }
  }
};
