'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if companies table exists, if not create it
    const [tables] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'companies'");
    if (tables.length === 0) {
      await queryInterface.createTable('companies', {
        id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
        company_id: { type: Sequelize.STRING(50), allowNull: false, unique: true },
        name: { type: Sequelize.STRING(255), allowNull: false },
        email: { type: Sequelize.STRING(255), allowNull: false, unique: true },
        status: { type: Sequelize.ENUM('active', 'inactive', 'suspended'), defaultValue: 'active' },
        created_at: { allowNull: false, type: Sequelize.DATE },
        updated_at: { allowNull: false, type: Sequelize.DATE }
      });
    }

    // Check if company_id column exists in users table
    const [columns] = await queryInterface.sequelize.query(
      "SHOW COLUMNS FROM users LIKE 'company_id'"
    );
    if (columns.length === 0) {
      await queryInterface.addColumn('users', 'company_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'companies', key: 'id' },
        onDelete: 'SET NULL'
      });
    }

    // Update role enum to include SuperAdmin
    await queryInterface.sequelize.query(`
      ALTER TABLE users MODIFY COLUMN role ENUM('SuperAdmin', 'CEO', 'Manager', 'Staff') DEFAULT 'Staff';
    `);

    // Add indexes only if they don't exist
    const [companyIndexes] = await queryInterface.sequelize.query("SHOW INDEXES FROM companies WHERE Key_name = 'company_id'");
    if (companyIndexes.length === 0) {
      await queryInterface.addIndex('companies', ['company_id'], { name: 'company_id' });
    }
    
    const [emailIndexes] = await queryInterface.sequelize.query("SHOW INDEXES FROM companies WHERE Key_name = 'email'");
    if (emailIndexes.length === 0) {
      await queryInterface.addIndex('companies', ['email'], { name: 'email' });
    }
    
    const [userCompanyIndexes] = await queryInterface.sequelize.query("SHOW INDEXES FROM users WHERE Key_name = 'users_company_id'");
    if (userCompanyIndexes.length === 0) {
      await queryInterface.addIndex('users', ['company_id'], { name: 'users_company_id' });
    }
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('users', ['company_id']);
    await queryInterface.removeIndex('companies', ['email']);
    await queryInterface.removeIndex('companies', ['company_id']);
    await queryInterface.removeColumn('users', 'company_id');
    await queryInterface.dropTable('companies');
  }
};

