const { Customer } = require('../models');
const { Op } = require('sequelize');

const getAll = async (filters = {}) => {
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${filters.search}%` } },
      { phone: { [Op.like]: `%${filters.search}%` } },
      { pace_user_id: { [Op.like]: `%${filters.search}%` } }
    ];
  }

  const { count, rows } = await Customer.findAndCountAll({
    where,
    limit: filters.limit || 10,
    offset: (filters.page - 1) * (filters.limit || 10),
    order: [['created_at', 'DESC']]
  });

  return {
    data: rows,
    pagination: {
      total: count,
      page: filters.page,
      limit: filters.limit,
      pages: Math.ceil(count / (filters.limit || 10))
    }
  };
};

const getById = async (id) => {
  return await Customer.findByPk(id);
};

const create = async (data) => {
  return await Customer.create({
    name: data.name.trim(),
    email: data.email?.trim(),
    phone: data.phone.trim(),
    address: data.address?.trim(),
    father_name: data.father_name?.trim(),
    gender: data.gender,
    whatsapp_number: data.whatsapp_number?.trim(),
    pace_user_id: data.pace_user_id?.trim(),
    areaId: data.areaId || null,
    status: data.status || 'active'
  });
};

const update = async (id, data) => {
  const customer = await Customer.findByPk(id);
  if (!customer) return null;

  const allowed = ['name', 'email', 'phone', 'address', 'father_name', 'gender', 'whatsapp_number', 'pace_user_id', 'areaId', 'status'];

  allowed.forEach(key => {
    if (data[key] !== undefined) {
      customer[key] = data[key] === null ? null : (typeof data[key] === 'string' ? data[key].trim() : data[key]);
    }
  });

  await customer.save();
  return customer;
};

const getStats = async () => {
  const [total, active] = await Promise.all([
    Customer.count(),
    Customer.count({ where: { status: 'active' } })
  ]);

  return { total, active };
};

module.exports = { getAll, getById, create, update, getStats };