'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Add a new temporary column with the new enum
      await queryInterface.addColumn('complaints', 'status_new', {
        type: Sequelize.ENUM('new', 'assigned', 'in_progress', 'on_hold', 'resolved', 'closed'),
        defaultValue: 'new',
        allowNull: true
      });

      // Migrate data from old status to new status
      await queryInterface.sequelize.query(`
        UPDATE complaints 
        SET status_new = CASE 
          WHEN status = 'open' THEN 'new'
          WHEN status = 'in_progress' THEN 'in_progress'
          WHEN status = 'on_hold' THEN 'on_hold'
          WHEN status = 'closed' THEN 'closed'
          ELSE 'new'
        END
      `);

      // Drop the old status column
      await queryInterface.removeColumn('complaints', 'status');

      // Rename the new column to status
      await queryInterface.renameColumn('complaints', 'status_new', 'status');

      // Make it not nullable
      await queryInterface.changeColumn('complaints', 'status', {
        type: Sequelize.ENUM('new', 'assigned', 'in_progress', 'on_hold', 'resolved', 'closed'),
        defaultValue: 'new',
        allowNull: false
      });
      
      console.log('✅ Updated complaint status enum to include new lifecycle stages');
    } catch (error) {
      console.error('❌ Error updating complaint status enum:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Add a temporary column with the old enum
      await queryInterface.addColumn('complaints', 'status_old', {
        type: Sequelize.ENUM('open', 'in_progress', 'on_hold', 'closed'),
        defaultValue: 'open',
        allowNull: true
      });

      // Migrate data from new status to old status
      await queryInterface.sequelize.query(`
        UPDATE complaints 
        SET status_old = CASE 
          WHEN status IN ('new', 'assigned') THEN 'open'
          WHEN status = 'resolved' THEN 'closed'
          WHEN status = 'in_progress' THEN 'in_progress'
          WHEN status = 'on_hold' THEN 'on_hold'
          WHEN status = 'closed' THEN 'closed'
          ELSE 'open'
        END
      `);

      // Drop the new status column
      await queryInterface.removeColumn('complaints', 'status');

      // Rename the old column back to status
      await queryInterface.renameColumn('complaints', 'status_old', 'status');

      // Make it not nullable
      await queryInterface.changeColumn('complaints', 'status', {
        type: Sequelize.ENUM('open', 'in_progress', 'on_hold', 'closed'),
        defaultValue: 'open',
        allowNull: false
      });
      
      console.log('✅ Reverted complaint status enum to original values');
    } catch (error) {
      console.error('❌ Error reverting complaint status enum:', error);
      throw error;
    }
  }
};
