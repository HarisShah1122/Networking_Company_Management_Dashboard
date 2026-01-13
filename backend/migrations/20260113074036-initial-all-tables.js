'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Users table
    await queryInterface.createTable('users', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      email: { type: Sequelize.STRING(255), allowNull: false, unique: true },
      username: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      password_hash: { type: Sequelize.STRING(255), allowNull: false },
      role: { type: Sequelize.ENUM('CEO', 'Manager', 'Staff'), defaultValue: 'Staff' },
      status: { type: Sequelize.ENUM('active', 'inactive'), defaultValue: 'active' },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    });

    // Customers table
    await queryInterface.createTable('customers', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      name: { type: Sequelize.STRING(255), allowNull: false },
      email: { type: Sequelize.STRING(255), allowNull: true },
      phone: { type: Sequelize.STRING(20), allowNull: false },
      address: { type: Sequelize.TEXT, allowNull: true },
      father_name: { type: Sequelize.STRING(255), allowNull: true },
      gender: { type: Sequelize.ENUM('male', 'female', 'other'), allowNull: true },
      whatsapp_number: { type: Sequelize.STRING(20), allowNull: true },
      status: { type: Sequelize.ENUM('active', 'inactive', 'suspended'), defaultValue: 'active' },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    });

    // Connections table
    await queryInterface.createTable('connections', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      customer_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'customers', key: 'id' }, onDelete: 'CASCADE' },
      connection_type: { type: Sequelize.STRING(100), allowNull: false },
      installation_date: { type: Sequelize.DATEONLY, allowNull: true },
      activation_date: { type: Sequelize.DATEONLY, allowNull: true },
      status: { type: Sequelize.ENUM('pending', 'completed', 'cancelled'), defaultValue: 'pending' },
      notes: { type: Sequelize.TEXT, allowNull: true },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    });

    // Recharges table
    await queryInterface.createTable('recharges', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      customer_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'customers', key: 'id' }, onDelete: 'CASCADE' },
      amount: { type: Sequelize.DECIMAL(10,2), allowNull: false },
      payment_method: { type: Sequelize.ENUM('cash','card','online','bank_transfer'), defaultValue: 'cash' },
      due_date: { type: Sequelize.DATEONLY, allowNull: true },
      status: { type: Sequelize.ENUM('pending','paid','overdue'), defaultValue: 'pending' },
      payment_date: { type: Sequelize.DATEONLY, allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      package: { type: Sequelize.STRING(255), allowNull: true },
      name: { type: Sequelize.STRING(255), allowNull: true },
      address: { type: Sequelize.TEXT, allowNull: true },
      whatsapp_number: { type: Sequelize.STRING(20), allowNull: true },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    });

    // Stock table
    await queryInterface.createTable('stock_items', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      name: { type: Sequelize.STRING(255), allowNull: false },
      category: { type: Sequelize.STRING(100), allowNull: true },
      quantity_available: { type: Sequelize.INTEGER, defaultValue: 0 },
      quantity_used: { type: Sequelize.INTEGER, defaultValue: 0 },
      unit_price: { type: Sequelize.DECIMAL(10,2), defaultValue: 0.00 },
      description: { type: Sequelize.TEXT, allowNull: true },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    });

    // Transactions table
    await queryInterface.createTable('transactions', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      type: { type: Sequelize.ENUM('income','expense'), allowNull: false },
      amount: { type: Sequelize.DECIMAL(10,2), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      category: { type: Sequelize.STRING(100), allowNull: true },
      date: { type: Sequelize.DATEONLY, allowNull: false },
      created_by: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    });

    // Activity logs table
    await queryInterface.createTable('activity_logs', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      user_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      action: { type: Sequelize.STRING(100), allowNull: false },
      model: { type: Sequelize.STRING(100), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    });

    // Complaints table
    await queryInterface.createTable('complaints', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      customer_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'customers', key: 'id' } },
      connection_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'connections', key: 'id' } },
      title: { type: Sequelize.STRING(255), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: false },
      status: { type: Sequelize.ENUM('open','in_progress','resolved','closed'), defaultValue: 'open' },
      priority: { type: Sequelize.ENUM('low','medium','high','urgent'), defaultValue: 'medium' },
      assigned_to: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' } },
      name: { type: Sequelize.STRING(255), allowNull: true },
      address: { type: Sequelize.TEXT, allowNull: true },
      whatsapp_number: { type: Sequelize.STRING(20), allowNull: true },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    });

    // Package renewals table
    await queryInterface.createTable('package_renewals', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      connection_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'connections', key: 'id' } },
      previous_package: { type: Sequelize.STRING(100), allowNull: true },
      new_package: { type: Sequelize.STRING(100), allowNull: false },
      renewal_date: { type: Sequelize.DATEONLY, allowNull: false },
      expiry_date: { type: Sequelize.DATEONLY, allowNull: false },
      amount_paid: { type: Sequelize.DECIMAL(10,2), allowNull: true },
      renewed_by: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      status: { type: Sequelize.ENUM('pending','completed','failed'), defaultValue: 'completed' },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    });

    // Payments table
    await queryInterface.createTable('payments', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      customer_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'customers', key: 'id' } },
      connection_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'connections', key: 'id' } },
      recharge_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'recharges', key: 'id' } },
      amount: { type: Sequelize.DECIMAL(10,2), allowNull: false },
      payment_method: { type: Sequelize.ENUM('cash','bank_transfer','mobile_wallet','card'), defaultValue: 'cash' },
      reference_number: { type: Sequelize.STRING(100), allowNull: true },
      received_by: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      notes: { type: Sequelize.TEXT, allowNull: true },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('payments');
    await queryInterface.dropTable('package_renewals');
    await queryInterface.dropTable('complaints');
    await queryInterface.dropTable('activity_logs');
    await queryInterface.dropTable('transactions');
    await queryInterface.dropTable('stock_items');
    await queryInterface.dropTable('recharges');
    await queryInterface.dropTable('connections');
    await queryInterface.dropTable('customers');
    await queryInterface.dropTable('users');
  }
};
