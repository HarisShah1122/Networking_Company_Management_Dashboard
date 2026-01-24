'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if PACE TELECOM company already exists
    const [existingCompanies] = await queryInterface.sequelize.query(
      "SELECT * FROM companies WHERE name = 'PACE TELECOM' OR email = 'info@pacetelecom.com'"
    );

    if (existingCompanies.length === 0) {
      const companyId = Sequelize.Utils.toDefaultValue(Sequelize.UUIDV4());
      const randomId = Math.floor(100000000 + Math.random() * 900000000);
      const company_id = `ISP-${randomId}`;

      return queryInterface.bulkInsert('companies', [{
        id: companyId,
        company_id: company_id,
        name: 'PACE TELECOM',
        email: 'info@pacetelecom.com',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      }], {});
    } else {
      console.log('PACE TELECOM company already exists, skipping...');
      return Promise.resolve();
    }
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('companies', { name: 'PACE TELECOM' }, {});
  }
};

