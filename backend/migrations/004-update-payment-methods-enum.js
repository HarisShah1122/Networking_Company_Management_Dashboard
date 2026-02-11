'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, update the enum for payment_method
    await queryInterface.changeColumn('payments', 'payment_method', {
      type: Sequelize.ENUM('cash', 'bank_transfer', 'mobile_wallet', 'card', 'jazz_cash', 'easypaisa'),
      allowNull: false,
      defaultValue: 'cash'
    });

    // Then add the original_payment_method field
    await queryInterface.addColumn('payments', 'original_payment_method', {
      type: Sequelize.ENUM('cash', 'bank_transfer', 'mobile_wallet', 'card', 'jazz_cash', 'easypaisa'),
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the original_payment_method field
    await queryInterface.removeColumn('payments', 'original_payment_method');
    
    // Revert payment_method to original enum
    await queryInterface.changeColumn('payments', 'payment_method', {
      type: Sequelize.ENUM('cash', 'bank_transfer', 'mobile_wallet', 'card'),
      allowNull: false,
      defaultValue: 'cash'
    });
  }
};
