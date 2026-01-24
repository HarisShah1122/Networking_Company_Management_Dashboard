'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('transactions', 'trxId', {
      type: Sequelize.STRING(50),
      allowNull: true,  
    });

    await queryInterface.addColumn('transactions', 'receiptImage', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('transactions', 'trxId');
    await queryInterface.removeColumn('transactions', 'receiptImage');
  }
};
