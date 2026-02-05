const { Op } = require('sequelize');
const { Stock } = require('../models');
const QueryBuilder = require('../helpers/queryBuilder');

const getAll = async (filters = {}, companyId) => {
  const { category, search } = filters;
  
  const where = QueryBuilder.combineWhere(
    category ? { category } : {},
    QueryBuilder.buildSearchQuery(['name'], search),
    companyId ? { company_id: companyId } : {}
  );

  return await Stock.findAll({
    where,
    order: [['name', 'ASC']]
  });
};

const getById = async (id, companyId) => {
  return await Stock.findOne({ 
    where: { 
      id, 
      company_id: companyId 
    } 
  });
};

const create = async (data, companyId) => {
  return await Stock.create({ ...data, company_id: companyId });
};

const update = async (id, data, companyId) => {
  const item = await Stock.findOne({ 
    where: { 
      id, 
      company_id: companyId 
    } 
  });
  if (!item) return null;

  await item.update(data);
  return item;
};

const deleteStock = async (id, companyId) => {
  const item = await Stock.findOne({ 
    where: { 
      id, 
      company_id: companyId 
    } 
  });
  if (!item) return false;

  await item.destroy();
  return true;
};

const getCategories = async (companyId) => {
  const whereClause = {
    category: { [Op.ne]: null }
  };
  if (companyId) whereClause.company_id = companyId;

  const categories = await Stock.findAll({
    attributes: [[Stock.sequelize.fn('DISTINCT', Stock.sequelize.col('category')), 'category']],
    where: whereClause,
    order: [['category', 'ASC']],
    raw: true
  });

  return categories.map(cat => cat.category).filter(Boolean);
};

const getStats = async (companyId) => {
  const whereClause = companyId ? { company_id: companyId } : {};
  
  const [stats] = await Stock.findAll({
    where: whereClause,
    attributes: [
      [Stock.sequelize.fn('COUNT', Stock.sequelize.col('id')), 'total_items'],
      [Stock.sequelize.fn('SUM', Stock.sequelize.col('quantity_available')), 'total_available'],
      [Stock.sequelize.fn('SUM', Stock.sequelize.col('quantity_used')), 'total_used'],
      [Stock.sequelize.fn('SUM', Stock.sequelize.literal('quantity_available * unit_price')), 'total_value']
    ],
    raw: true
  });

  return stats || { total_items: 0, total_available: 0, total_used: 0, total_value: 0 };
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  delete: deleteStock,
  getCategories,
  getStats
};
