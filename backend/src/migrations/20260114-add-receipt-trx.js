'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if trxId column exists in transactions table
    const [trxIdColumn] = await queryInterface.sequelize.query(
      "SHOW COLUMNS FROM transactions LIKE 'trxId'"
    );
    if (trxIdColumn.length === 0) {
      await queryInterface.addColumn('transactions', 'trxId', {
        type: Sequelize.STRING(50),
        allowNull: true,  
      });
    }

    // Check if receiptImage column exists in transactions table
    const [receiptImageColumn] = await queryInterface.sequelize.query(
      "SHOW COLUMNS FROM transactions LIKE 'receiptImage'"
    );
    if (receiptImageColumn.length === 0) {
      await queryInterface.addColumn('transactions', 'receiptImage', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
  },

  down: async (queryInterface) => {
    // Only remove columns if they exist
    try {
      const [trxIdColumn] = await queryInterface.sequelize.query(
        "SHOW COLUMNS FROM transactions LIKE 'trxId'"
      );
      if (trxIdColumn.length > 0) {
        await queryInterface.removeColumn('transactions', 'trxId');
      }
    } catch (error) {
      console.warn('Warning: Could not remove trxId column:', error.message);
    }

    try {
      const [receiptImageColumn] = await queryInterface.sequelize.query(
        "SHOW COLUMNS FROM transactions LIKE 'receiptImage'"
      );
      if (receiptImageColumn.length > 0) {
        await queryInterface.removeColumn('transactions', 'receiptImage');
      }
    } catch (error) {
      console.warn('Warning: Could not remove receiptImage column:', error.message);
    }
  }
};
