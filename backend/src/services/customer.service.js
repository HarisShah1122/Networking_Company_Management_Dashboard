const { Op } = require('sequelize');
const { Customer } = require('../models');
const QueryBuilder = require('../helpers/queryBuilder');
const { withColumnErrorFallback } = require('../helpers/dbErrorHandler');

const fetchCustomers = async (where, pageNum, limitNum) => {
  const offset = (pageNum - 1) * limitNum;
  const total = await Customer.count({ where });

  const customers = await Customer.findAll({
    where,
    attributes: ['id', 'name', 'phone', 'email', 'address', 'status', 'createdAt', 'updatedAt'],
    order: [['createdAt', 'DESC']],
    limit: limitNum,
    offset: offset,
    raw: true
  });

  const customersData = customers.map(customer => ({
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email ?? null,
    address: customer.address ?? null,
    status: customer.status,
    createdAt: customer.createdAt || customer.created_at,
    updatedAt: customer.updatedAt || customer.updated_at
  }));

  const total_pages = Math.ceil(total / limitNum);
  return {
    data: customersData,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      total_pages,
      has_next: pageNum < total_pages,
      has_prev: pageNum > 1
    }
  };
};

const getAll = async (filters = {}) => {
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

  return await withColumnErrorFallback(
    () => fetchCustomers(where, pageNum, limitNum),
    () => fetchCustomers(where, pageNum, limitNum)
  );
};

const getById = async (id) => {
  const customer = await Customer.findByPk(id, {
    attributes: ['id', 'name', 'phone', 'email', 'address', 'status', 'createdAt', 'updatedAt'],
    raw: true
  });
  if (!customer) return null;
  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email ?? null,
    address: customer.address ?? null,
    status: customer.status,
    createdAt: customer.createdAt || customer.created_at,
    updatedAt: customer.updatedAt || customer.updated_at
  };
};

const create = async (data) => {
  const fullCustomerData = {
    name: data.name,
    phone: data.phone,
    email: data.email ?? null,
    address: data.address ?? null,
    father_name: data.father_name ?? null,
    gender: data.gender ?? null,
    whatsapp_number: data.whatsapp_number ?? null,
    status: data.status ?? 'active'
  };

  const coreCustomerData = {
    name: data.name,
    phone: data.phone,
    email: data.email ?? null,
    status: data.status ?? 'active'
  };

  return await withColumnErrorFallback(
    () => Customer.create(fullCustomerData),
    () => Customer.create(coreCustomerData)
  );
};

const update = async (id, data) => {
  const customer = await Customer.findByPk(id);
  if (!customer) return null;

  const fullUpdateData = {
    name: data.name ?? customer.name,
    phone: data.phone ?? customer.phone,
    email: data.email ?? customer.email ?? null,
    address: data.address ?? customer.address ?? null,
    father_name: data.father_name ?? customer.father_name ?? null,
    gender: data.gender ?? customer.gender ?? null,
    whatsapp_number: data.whatsapp_number ?? customer.whatsapp_number ?? null,
    status: data.status ?? customer.status ?? 'active'
  };

  const coreUpdateData = {
    name: data.name ?? customer.name,
    phone: data.phone ?? customer.phone,
    email: data.email ?? customer.email ?? null,
    status: data.status ?? customer.status ?? 'active'
  };

  await withColumnErrorFallback(
    async () => {
      await customer.update(fullUpdateData);
      return customer;
    },
    async () => {
      await customer.update(coreUpdateData);
      return customer;
    }
  );

  return customer;
};

const deleteCustomer = async (id) => {
  const customer = await Customer.findByPk(id);
  if (!customer) return false;
  await customer.destroy();
  return true;
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

