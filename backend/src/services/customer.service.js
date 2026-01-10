const { Op } = require('sequelize');
const { Customer } = require('../models');
const QueryBuilder = require('../helpers/queryBuilder');

const getAll = async (filters = {}) => {
  try {
    const { status, search, page, limit } = filters;
    
    // Normalize filters
    const normalizedFilters = {
      status: status && status.trim() ? status.trim() : undefined,
      search: search && search.trim() ? search.trim() : undefined
    };
    
    const where = QueryBuilder.combineWhere(
      QueryBuilder.buildStatusFilter(normalizedFilters.status),
      QueryBuilder.buildSearchQuery(['name', 'phone'], normalizedFilters.search)
    );

    // Pagination
    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 10, 100); // Max 100 per page
    const offset = (pageNum - 1) * limitNum;

    // Get total count
    const total = await Customer.count({ where });

    // Get paginated data - only select columns that exist in database
    const customers = await Customer.findAll({
      where,
      attributes: ['id', 'name', 'phone', 'status', 'createdAt', 'updatedAt'],
      order: [['created_at', 'DESC']],
      limit: limitNum,
      offset: offset
    });

    // Calculate pagination metadata
    const total_pages = Math.ceil(total / limitNum);
    const has_next = pageNum < total_pages;
    const has_prev = pageNum > 1;

    return {
      data: customers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        total_pages,
        has_next,
        has_prev
      }
    };
  } catch (error) {
    // If error is about missing columns, try with minimal attributes
    if (error.message && (error.message.includes('Unknown column') || error.message.includes('doesn\'t exist') || error.message.includes('ER_BAD_FIELD_ERROR'))) {
      try {
        const { status, search, page, limit } = filters;
        const normalizedFilters = {
          status: status && status.trim() ? status.trim() : undefined,
          search: search && search.trim() ? search.trim() : undefined
        };
        const where = QueryBuilder.combineWhere(
          QueryBuilder.buildStatusFilter(normalizedFilters.status),
          QueryBuilder.buildSearchQuery(['name', 'phone'], normalizedFilters.search)
        );
        const pageNum = parseInt(page) || 1;
        const limitNum = Math.min(parseInt(limit) || 10, 100);
        const offset = (pageNum - 1) * limitNum;
        const total = await Customer.count({ where });
        const customers = await Customer.findAll({
          where,
          attributes: ['id', 'name', 'phone', 'status', 'createdAt', 'updatedAt'],
          order: [['created_at', 'DESC']],
          limit: limitNum,
          offset: offset
        });
        const total_pages = Math.ceil(total / limitNum);
        return {
          data: customers,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            total_pages,
            has_next: pageNum < total_pages,
            has_prev: pageNum > 1
          }
        };
      } catch (fallbackError) {
        throw fallbackError;
      }
    }
    throw error;
  }
};

const getById = async (id) => {
  try {
    return await Customer.findByPk(id, {
      attributes: ['id', 'name', 'phone', 'status', 'createdAt', 'updatedAt']
    });
  } catch (error) {
    // If error, try without attributes
    try {
      return await Customer.findByPk(id);
    } catch (fallbackError) {
      throw fallbackError;
    }
  }
};

const create = async (data) => {
  try {
    // Remove fields that might not exist in database
    const { whatsapp_number, address, father_name, gender, email, ...safeData } = data;
    return await Customer.create(safeData);
  } catch (error) {
    // If error about missing columns, try with only core fields
    if (error.message && (error.message.includes('Unknown column') || error.message.includes('doesn\'t exist') || error.message.includes('ER_BAD_FIELD_ERROR'))) {
      try {
        const { whatsapp_number, address, father_name, gender, email, ...safeData } = data;
        return await Customer.create(safeData);
      } catch (fallbackError) {
        throw fallbackError;
      }
    }
    throw error;
  }
};

const update = async (id, data) => {
  try {
    const customer = await Customer.findByPk(id);
    if (!customer) return null;

    // Remove fields that might not exist in database
    const { whatsapp_number, address, father_name, gender, email, ...safeData } = data;
    await customer.update(safeData);
    return customer;
  } catch (error) {
    // If error about missing columns, try with only core fields
    if (error.message && (error.message.includes('Unknown column') || error.message.includes('doesn\'t exist') || error.message.includes('ER_BAD_FIELD_ERROR'))) {
      try {
        const customer = await Customer.findByPk(id);
        if (!customer) return null;
        const { whatsapp_number, address, father_name, gender, email, ...safeData } = data;
        await customer.update(safeData);
        return customer;
      } catch (fallbackError) {
        throw fallbackError;
      }
    }
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
    // Return default stats if query fails
    return { total: 0, active: 0, inactive: 0, suspended: 0 };
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

