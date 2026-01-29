'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('complaints', 'latitude', {
      type: Sequelize.DECIMAL(10, 8),
      allowNull: true
    });

    await queryInterface.addColumn('complaints', 'longitude', {
      type: Sequelize.DECIMAL(11, 8),
      allowNull: true
    });

    await queryInterface.addColumn('complaints', 'area', {
      type: Sequelize.STRING(255),
      allowNull: true
    });

    await queryInterface.addColumn('complaints', 'city', {
      type: Sequelize.STRING(100),
      allowNull: true
    });

    await queryInterface.addColumn('complaints', 'province', {
      type: Sequelize.STRING(100),
      allowNull: true
    });

    await queryInterface.addColumn('complaints', 'postal_code', {
      type: Sequelize.STRING(20),
      allowNull: true
    });

    await queryInterface.addColumn('complaints', 'landmark', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('complaints', 'latitude');
    await queryInterface.removeColumn('complaints', 'longitude');
    await queryInterface.removeColumn('complaints', 'area');
    await queryInterface.removeColumn('complaints', 'city');
    await queryInterface.removeColumn('complaints', 'province');
    await queryInterface.removeColumn('complaints', 'postal_code');
    await queryInterface.removeColumn('complaints', 'landmark');
  }
};
