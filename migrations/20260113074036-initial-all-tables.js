'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Areas (new table - must come before customers)
    await queryInterface.createTable('areas', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      name: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      code: { type: Sequelize.STRING(20), allowNull: true },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    });

    // 2. Users
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

    // 3. Customers (now includes pace_user_id & area_id)
    await queryInterface.createTable('customers', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      name: { type: Sequelize.STRING(255), allowNull: false },
      email: { type: Sequelize.STRING(255), allowNull: true },
      phone: { type: Sequelize.STRING(20), allowNull: false },
      address: { type: Sequelize.TEXT, allowNull: true },
      father_name: { type: Sequelize.STRING(255), allowNull: true },
      gender: { type: Sequelize.ENUM('male', 'female', 'other'), allowNull: true },
      whatsapp_number: { type: Sequelize.STRING(20), allowNull: true },
      pace_user_id: { type: Sequelize.STRING(50), allowNull: true, unique: true },
      area_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'areas', key: 'id' }, onDelete: 'SET NULL' },
      status: { type: Sequelize.ENUM('active', 'inactive', 'suspended'), defaultValue: 'active' },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    });

    // 4. Connections
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

    // 5. Recharges
    await queryInterface.createTable('recharges', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      customer_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'customers', key: 'id' }, onDelete: 'CASCADE' },
      amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      payment_method: { type: Sequelize.ENUM('cash', 'card', 'online', 'bank_transfer'), defaultValue: 'cash' },
      due_date: { type: Sequelize.DATEONLY, allowNull: true },
      status: { type: Sequelize.ENUM('pending', 'paid', 'overdue'), defaultValue: 'pending' },
      payment_date: { type: Sequelize.DATEONLY, allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      package: { type: Sequelize.STRING(255), allowNull: true },
      name: { type: Sequelize.STRING(255), allowNull: true },
      address: { type: Sequelize.TEXT, allowNull: true },
      whatsapp_number: { type: Sequelize.STRING(20), allowNull: true },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    });

    // 6. Stock items
    await queryInterface.createTable('stock_items', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      name: { type: Sequelize.STRING(255), allowNull: false },
      category: { type: Sequelize.STRING(100), allowNull: true },
      quantity_available: { type: Sequelize.INTEGER, defaultValue: 0 },
      quantity_used: { type: Sequelize.INTEGER, defaultValue: 0 },
      unit_price: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0.00 },
      description: { type: Sequelize.TEXT, allowNull: true },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    });

    // 7. Transactions
    await queryInterface.createTable('transactions', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      type: { type: Sequelize.ENUM('income', 'expense'), allowNull: false },
      amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      category: { type: Sequelize.STRING(100), allowNull: true },
      date: { type: Sequelize.DATEONLY, allowNull: false },
      created_by: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    });

    // 8. Activity logs
    await queryInterface.createTable('activity_logs', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      user_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      action: { type: Sequelize.STRING(100), allowNull: false },
      model: { type: Sequelize.STRING(100), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    });

    // 9. Complaints
    await queryInterface.createTable('complaints', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      customer_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'customers', key: 'id' } },
      connection_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'connections', key: 'id' } },
      title: { type: Sequelize.STRING(255), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: false },
      status: { type: Sequelize.ENUM('open', 'in_progress', 'resolved', 'closed'), defaultValue: 'open' },
      priority: { type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'), defaultValue: 'medium' },
      assigned_to: { type: Sequelize.UUID, allowNull: true, references: { model: 'users', key: 'id' } },
      name: { type: Sequelize.STRING(255), allowNull: true },
      address: { type: Sequelize.TEXT, allowNull: true },
      whatsapp_number: { type: Sequelize.STRING(20), allowNull: true },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    });

    // 10. Package renewals
    await queryInterface.createTable('package_renewals', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      connection_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'connections', key: 'id' } },
      previous_package: { type: Sequelize.STRING(100), allowNull: true },
      new_package: { type: Sequelize.STRING(100), allowNull: false },
      renewal_date: { type: Sequelize.DATEONLY, allowNull: false },
      expiry_date: { type: Sequelize.DATEONLY, allowNull: false },
      amount_paid: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
      renewed_by: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      status: { type: Sequelize.ENUM('pending', 'completed', 'failed'), defaultValue: 'completed' },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    });

    // 11. Payments
    await queryInterface.createTable('payments', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      customer_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'customers', key: 'id' } },
      connection_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'connections', key: 'id' } },
      recharge_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'recharges', key: 'id' } },
      amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      payment_method: { type: Sequelize.ENUM('cash', 'bank_transfer', 'mobile_wallet', 'card'), defaultValue: 'cash' },
      reference_number: { type: Sequelize.STRING(100), allowNull: true },
      received_by: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      notes: { type: Sequelize.TEXT, allowNull: true },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    });

    // === INDEXES ===

    // customers
    await queryInterface.addIndex('customers', ['phone']);
    await queryInterface.addIndex('customers', ['email']);
    await queryInterface.addIndex('customers', ['status']);
    await queryInterface.addIndex('customers', ['name']);
    await queryInterface.addIndex('customers', ['pace_user_id']);
    await queryInterface.addIndex('customers', ['area_id']);

    // connections
    await queryInterface.addIndex('connections', ['customer_id']);
    await queryInterface.addIndex('connections', ['status']);
    await queryInterface.addIndex('connections', ['created_at']);

    // recharges
    await queryInterface.addIndex('recharges', ['customer_id']);
    await queryInterface.addIndex('recharges', ['status']);
    await queryInterface.addIndex('recharges', ['due_date']);
    await queryInterface.addIndex('recharges', ['created_at']);

    // stock_items
    await queryInterface.addIndex('stock_items', ['category']);
    await queryInterface.addIndex('stock_items', ['name']);
    await queryInterface.addIndex('stock_items', ['created_at']);

    // transactions
    await queryInterface.addIndex('transactions', ['created_by']);
    await queryInterface.addIndex('transactions', ['type']);
    await queryInterface.addIndex('transactions', ['date']);
    await queryInterface.addIndex('transactions', ['created_at']);

    // complaints
    await queryInterface.addIndex('complaints', ['customer_id']);
    await queryInterface.addIndex('complaints', ['connection_id']);
    await queryInterface.addIndex('complaints', ['assigned_to']);
    await queryInterface.addIndex('complaints', ['status']);
    await queryInterface.addIndex('complaints', ['priority']);

    // activity_logs
    await queryInterface.addIndex('activity_logs', ['user_id']);
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
    await queryInterface.dropTable('areas');
    await queryInterface.dropTable('users');
  }
};