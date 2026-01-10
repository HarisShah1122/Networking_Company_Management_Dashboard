const { Op } = require('sequelize');

class QueryBuilder {
  static buildSearchQuery(searchFields, searchTerm) {
    if (!searchTerm || typeof searchTerm !== 'string' || !searchTerm.trim()) {
      return {};
    }

    const trimmedSearch = searchTerm.trim();
    
    return {
      [Op.or]: searchFields.map(field => ({
        [field]: { 
          [Op.like]: `%${trimmedSearch}%`
        }
      }))
    };
  }

  static buildStatusFilter(status) {
    return status ? { status } : {};
  }

  static buildDateRange(startDate, endDate, field = 'date') {
    if (!startDate || !endDate) return {};

    return {
      [field]: {
        [Op.between]: [startDate, endDate]
      }
    };
  }

  static buildPagination(page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    return {
      limit: Math.min(limit, 100), // Max 100 items per page
      offset: Math.max(offset, 0)
    };
  }

  static buildOrder(sortBy, order = 'DESC', defaultSort = 'created_at') {
    const sortField = sortBy || defaultSort;
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    return [[sortField, sortOrder]];
  }

  static combineWhere(...clauses) {
    return Object.assign({}, ...clauses.filter(clause => Object.keys(clause).length > 0));
  }
}

module.exports = QueryBuilder;

