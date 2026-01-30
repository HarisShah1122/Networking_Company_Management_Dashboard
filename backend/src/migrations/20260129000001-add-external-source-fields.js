'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add external source tracking fields
    const fields = [
      { name: 'company_id', type: Sequelize.UUID },
      { name: 'external_source', type: Sequelize.STRING(50) },
      { name: 'external_id', type: Sequelize.STRING(100) },
      { name: 'source_type', type: Sequelize.ENUM('internal', 'external'), defaultValue: 'internal' }
    ];

    for (const field of fields) {
      try {
        await queryInterface.addColumn('complaints', field.name, {
          type: field.type,
          allowNull: true,
          defaultValue: field.defaultValue
        });
      } catch (error) {
      }
    }

    // Add indexes for new fields
    const indexes = ['company_id', 'external_source', 'source_type'];
    
    for (const index of indexes) {
      try {
        await queryInterface.addIndex('complaints', [index]);
      } catch (error) {
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove external source tracking fields
    const fields = ['source_type', 'external_id', 'external_source', 'company_id'];
    
    for (const field of fields) {
      try {
        await queryInterface.removeColumn('complaints', field);
      } catch (error) {
      }
    }
  }
};
