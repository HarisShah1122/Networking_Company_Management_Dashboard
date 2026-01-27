const { Customer } = require('../models');
const { Op } = require('sequelize');

const getAll = async (filters = {}, companyId) => {
  const where = {};
  
  if (companyId) {
    where.company_id = companyId;
  }
  
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

const getById = async (id, companyId) => {
  return await Customer.findOne({ 
    where: { 
      id, 
      company_id: companyId
    } 
  });
};

const create = async (data, companyId) => {
  if (data.pace_user_id) {
    const existing = await Customer.findOne({ 
      where: { 
        pace_user_id: data.pace_user_id.trim(),
        company_id: companyId
      } 
    });
    if (existing) {
      const err = new Error('PACE USER ID already exists');
      err.status = 409;
      throw err;
    }
  }

  return await Customer.create({
    name: data.name.trim(),
    email: data.email?.trim(),
    phone: data.phone.trim(),
    address: data.address?.trim(),
    father_name: data.father_name?.trim(),
    gender: data.gender,
    whatsapp_number: data.whatsapp_number?.trim(),
    pace_user_id: data.pace_user_id?.trim(),
    area_id: data.area_id || null,
    company_id: companyId,
    status: data.status || 'active'
  });
};

const update = async (id, data, companyId) => {
  const customer = await Customer.findOne({ 
    where: { 
      id, 
      company_id: companyId
    } 
  });
  if (!customer) return null;

  const allowed = ['name', 'email', 'phone', 'address', 'father_name', 'gender', 'whatsapp_number', 'pace_user_id', 'area_id', 'status'];

  allowed.forEach(key => {
    if (data[key] !== undefined) {
      customer[key] = data[key] === null ? null : (typeof data[key] === 'string' ? data[key].trim() : data[key]);
    }
  });

  await customer.save();
  return customer;
};

const getStats = async (companyId) => {
  const [total, active] = await Promise.all([
    Customer.count({ where: { company_id: companyId } }),
    Customer.count({ where: { status: 'active', company_id: companyId } })
  ]);

  return { total, active };
};

module.exports = { getAll, getById, create, update, getStats };