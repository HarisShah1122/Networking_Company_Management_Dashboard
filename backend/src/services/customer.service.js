const { Op } = require('sequelize');
const { Customer } = require('../models');
const QueryBuilder = require('../helpers/queryBuilder');

class CustomerService {
  static async getAll(filters = {}) {
    const { status, search } = filters;
    
    const where = QueryBuilder.combineWhere(
      QueryBuilder.buildStatusFilter(status),
      QueryBuilder.buildSearchQuery(['name', 'phone', 'email'], search)
    );

    return await Customer.findAll({
      where,
      order: [['created_at', 'DESC']]
    });
  }

  static async getById(id) {
    return await Customer.findByPk(id);
  }

  static async create(data) {
    return await Customer.create(data);
  }

  static async update(id, data) {
    const customer = await Customer.findByPk(id);
    if (!customer) return null;

    await customer.update(data);
    return customer;
  }

  static async delete(id) {
    const customer = await Customer.findByPk(id);
    if (!customer) return false;

    await customer.destroy();
    return true;
  }

  static async getStats() {
    const [stats] = await Customer.findAll({
      attributes: [
        [Customer.sequelize.fn('COUNT', Customer.sequelize.col('id')), 'total'],
        [Customer.sequelize.fn('SUM', Customer.sequelize.literal("CASE WHEN status = 'active' THEN 1 ELSE 0 END")), 'active'],
        [Customer.sequelize.fn('SUM', Customer.sequelize.literal("CASE WHEN status = 'inactive' THEN 1 ELSE 0 END")), 'inactive'],
        [Customer.sequelize.fn('SUM', Customer.sequelize.literal("CASE WHEN status = 'suspended' THEN 1 ELSE 0 END")), 'suspended']
      ],
      raw: true
    });

    return stats || { total: 0, active: 0, inactive: 0, suspended: 0 };
  }
}

module.exports = CustomerService;

