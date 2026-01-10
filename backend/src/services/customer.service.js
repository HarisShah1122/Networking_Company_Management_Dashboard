const { Op } = require('sequelize');
const { Customer } = require('../models');
const QueryBuilder = require('../helpers/queryBuilder');

const getAll = async (filters = {}) => {
  try {
    const { status, search } = filters;
    
    // Normalize filters
    const normalizedFilters = {
      status: status && status.trim() ? status.trim() : undefined,
      search: search && search.trim() ? search.trim() : undefined
    };
    
    const where = QueryBuilder.combineWhere(
      QueryBuilder.buildStatusFilter(normalizedFilters.status),
      QueryBuilder.buildSearchQuery(['name', 'phone', 'email'], normalizedFilters.search)
    );

    return await Customer.findAll({
      where,
      order: [['created_at', 'DESC']]
    });
  } catch (error) {
    console.error('Error in customer service getAll:', error);
    throw error;
  }
};

const getById = async (id) => {
  try {
    return await Customer.findByPk(id);
  } catch (error) {
    throw error;
  }
};

const create = async (data) => {
  try {
    return await Customer.create(data);
  } catch (error) {
    throw error;
  }
};

const update = async (id, data) => {
  try {
    const customer = await Customer.findByPk(id);
    if (!customer) return null;

    await customer.update(data);
    return customer;
  } catch (error) {
    throw error;
  }
};

const deleteCustomer = async (id) => {
  try {
    const customer = await Customer.findByPk(id);
    if (!customer) return false;

    await customer.destroy();
    return true;
  } catch (error) {
    throw error;
  }
};

const getStats = async () => {
  try {
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
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  delete: deleteCustomer,
  getStats
};

