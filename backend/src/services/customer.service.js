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
  try {
    console.log('🔍 Creating customer with data:', { ...data, companyId });
    
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

    const customerData = {
      name: data.name.trim(),
      email: data.email?.trim() || null,
      phone: data.phone.trim(),
      address: data.address?.trim() || null,
      father_name: data.father_name?.trim() || null,
      gender: data.gender || null,
      whatsapp_number: data.whatsapp_number?.trim() || null,
      pace_user_id: data.pace_user_id?.trim() || null,
      area_id: data.area_id || null,
      company_id: companyId,
      status: data.status || 'active'
    };
    
    console.log('🔍 Customer data to create:', customerData);
    
    const customer = await Customer.create(customerData);
    console.log('✅ Customer created successfully:', customer.toJSON());

    // Send welcome email notification
    if (customer.email && companyId) {
      try {
        const emailService = require('./email.service');
        const { Company } = require('../models');
        const company = await Company.findByPk(companyId);
        
        if (company) {
          await emailService.sendCustomerWelcomeNotification(
            customer.email,
            customer.toJSON(),
            company.toJSON()
          );
          console.log(`📧 Welcome email sent to ${customer.email}`);
        }
      } catch (emailError) {
        console.warn('⚠️ Failed to send welcome email:', emailError.message);
      }
    }

    return customer;
  } catch (error) {
    console.error('❌ Customer creation failed:', error);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      sql: error.sql,
      fields: error.fields
    });
    
    // Handle specific database errors
    if (error.name === 'SequelizeUniqueConstraintError') {
      if (error.fields?.includes('pace_user_id')) {
        throw new Error('PACE USER ID already exists');
      }
      if (error.fields?.includes('email')) {
        throw new Error('Email already exists');
      }
      throw new Error('A unique constraint violation occurred');
    }
    
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(err => err.message).join(', ');
      throw new Error(`Validation failed: ${messages}`);
    }
    
    if (error.name === 'SequelizeDatabaseError') {
      throw new Error(`Database error: ${error.message}. Please check if the database table has the required columns.`);
    }
    
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      if (error.index === 'customers_area_id_fkey') {
        throw new Error('Invalid area selected');
      }
      if (error.index === 'customers_company_id_fkey') {
        throw new Error('Invalid company');
      }
      throw new Error('Invalid reference data provided');
    }
    
    // Re-throw custom errors
    if (error.status) {
      throw error;
    }
    
    // Generic error
    throw new Error(`Failed to create customer: ${error.message}`);
  }
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
  const whereClause = companyId ? { company_id: companyId } : {};
  
  const [total, active] = await Promise.all([
    Customer.count({ where: whereClause }),
    Customer.count({ where: { ...whereClause, status: 'active' } })
  ]);

  return { total, active };
};

module.exports = { getAll, getById, create, update, getStats };