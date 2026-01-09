const { Op } = require('sequelize');
const { Transaction, User } = require('../models');
const QueryBuilder = require('../helpers/queryBuilder');

class TransactionService {
  static async getAll(filters = {}) {
    const { type, category, start_date, end_date } = filters;
    
    const where = QueryBuilder.combineWhere(
      type ? { type } : {},
      category ? { category } : {},
      QueryBuilder.buildDateRange(start_date, end_date)
    );

    const transactions = await Transaction.findAll({
      where,
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'username']
      }],
      order: [['date', 'DESC'], ['created_at', 'DESC']]
    });

    return this.formatTransactions(transactions);
  }

  static async getById(id) {
    const transaction = await Transaction.findByPk(id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'username']
      }]
    });

    if (!transaction) return null;

    return this.formatTransaction(transaction);
  }

  static async create(data, userId) {
    const transaction = await Transaction.create({
      ...data,
      created_by: userId
    });
    
    return await this.getById(transaction.id);
  }

  static async update(id, data) {
    const transaction = await Transaction.findByPk(id);
    if (!transaction) return null;

    await transaction.update(data);
    return await this.getById(id);
  }

  static async delete(id) {
    const transaction = await Transaction.findByPk(id);
    if (!transaction) return false;

    await transaction.destroy();
    return true;
  }

  static async getSummary(filters = {}) {
    const { start_date, end_date } = filters;
    
    const where = QueryBuilder.buildDateRange(start_date, end_date);

    const [summary] = await Transaction.findAll({
      where,
      attributes: [
        [Transaction.sequelize.fn('SUM', Transaction.sequelize.literal("CASE WHEN type = 'income' THEN amount ELSE 0 END")), 'total_income'],
        [Transaction.sequelize.fn('SUM', Transaction.sequelize.literal("CASE WHEN type = 'expense' THEN amount ELSE 0 END")), 'total_expense'],
        [Transaction.sequelize.literal("SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) - SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END)"), 'profit_loss']
      ],
      raw: true
    });

    return summary || { total_income: 0, total_expense: 0, profit_loss: 0 };
  }

  static async getByCategory(filters = {}) {
    const { start_date, end_date } = filters;
    
    const where = {
      category: { [Op.ne]: null },
      ...QueryBuilder.buildDateRange(start_date, end_date)
    };

    return await Transaction.findAll({
      where,
      attributes: [
        'category',
        'type',
        [Transaction.sequelize.fn('SUM', Transaction.sequelize.col('amount')), 'total']
      ],
      group: ['category', 'type'],
      order: [[Transaction.sequelize.literal('total'), 'DESC']],
      raw: true
    });
  }

  static formatTransaction(transaction) {
    const formatted = transaction.toJSON();
    return {
      ...formatted,
      created_by_name: transaction.creator?.username
    };
  }

  static formatTransactions(transactions) {
    return transactions.map(t => ({
      ...t.toJSON(),
      created_by_name: t.creator?.username
    }));
  }
}

module.exports = TransactionService;

