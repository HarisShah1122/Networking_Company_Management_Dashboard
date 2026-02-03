'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const fields = [
      { name: 'latitude', type: Sequelize.DECIMAL(10, 8) },
      { name: 'longitude', type: Sequelize.DECIMAL(11, 8) },
      { name: 'area', type: Sequelize.STRING(255) },
      { name: 'district', type: Sequelize.STRING(100) },
      { name: 'city', type: Sequelize.STRING(100) },
      { name: 'province', type: Sequelize.STRING(100) },
      { name: 'postal_code', type: Sequelize.STRING(20) },
      { name: 'landmark', type: Sequelize.STRING(255) }
    ];

    for (const field of fields) {
      try {
        await queryInterface.addColumn('complaints', field.name, {
          type: field.type,
          allowNull: true
        });
        console.log(`Added column ${field.name}`);
      } catch (error) {
        console.log(`Column ${field.name} already exists, skipping...`);
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    const fields = ['latitude', 'longitude', 'area', 'district', 'city', 'province', 'postal_code', 'landmark'];
    
    for (const field of fields) {
      try {
        await queryInterface.removeColumn('complaints', field);
        console.log(`Removed column ${field.name}`);
      } catch (error) {
        console.log(`Column ${field.name} doesn't exist, skipping...`);
      }
    }
  }
};
