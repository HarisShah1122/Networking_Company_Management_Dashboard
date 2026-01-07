const { Op } = require('sequelize');
const { Stock } = require('../models');
const QueryBuilder = require('../helpers/queryBuilder');

class StockService {
  static async getAll(filters = {}) {
    const { category, search } = filters;
    
    const where = QueryBuilder.combineWhere(
      category ? { category } : {},
      QueryBuilder.buildSearchQuery(['name'], search)
    );

    return await Stock.findAll({
      where,
      order: [['name', 'ASC']]
    });
  }

  static async getById(id) {
    return await Stock.findByPk(id);
  }

  static async create(data) {
    return await Stock.create(data);
  }

  static async update(id, data) {
    const item = await Stock.findByPk(id);
    if (!item) return null;

    await item.update(data);
    return item;
  }

  static async delete(id) {
    const item = await Stock.findByPk(id);
    if (!item) return false;

    await item.destroy();
    return true;
  }

  static async getCategories() {
    const categories = await Stock.findAll({
      attributes: [[Stock.sequelize.fn('DISTINCT', Stock.sequelize.col('category')), 'category']],
      where: {
        category: { [Op.ne]: null }
      },
      order: [['category', 'ASC']],
      raw: true
    });

    return categories.map(cat => cat.category).filter(Boolean);
  }

  static async getStats() {
    const [stats] = await Stock.findAll({
      attributes: [
        [Stock.sequelize.fn('COUNT', Stock.sequelize.col('id')), 'total_items'],
        [Stock.sequelize.fn('SUM', Stock.sequelize.col('quantity_available')), 'total_available'],
        [Stock.sequelize.fn('SUM', Stock.sequelize.col('quantity_used')), 'total_used'],
        [Stock.sequelize.fn('SUM', Stock.sequelize.literal('quantity_available * unit_price')), 'total_value']
      ],
      raw: true
    });

    return stats || { total_items: 0, total_available: 0, total_used: 0, total_value: 0 };
  }
}

module.exports = StockService;

