'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Find PACE TELECOM company
    const [paceTelecom] = await queryInterface.sequelize.query(
      "SELECT id FROM companies WHERE name = 'PACE TELECOM' LIMIT 1"
    );

    if (paceTelecom.length > 0) {
      const companyId = paceTelecom[0].id;
      
      // Update CEO users without a company to be linked to PACE TELECOM
      await queryInterface.sequelize.query(
        `UPDATE users SET company_id = '${companyId}' WHERE role = 'CEO' AND company_id IS NULL`
      );
      
      console.log('CEO users linked to PACE TELECOM');
    }
    
    return Promise.resolve();
  },

  async down(queryInterface, Sequelize) {
    // Unlink CEO users from PACE TELECOM
    await queryInterface.sequelize.query(
      "UPDATE users SET company_id = NULL WHERE role = 'CEO'"
    );
    return Promise.resolve();
  }
};

