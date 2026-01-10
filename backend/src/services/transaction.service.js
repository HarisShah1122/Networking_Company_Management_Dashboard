const { Op } = require('sequelize');
const { Transaction, User } = require('../models');
const QueryBuilder = require('../helpers/queryBuilder');

const formatTransaction = (transaction) => {
  const formatted = transaction.toJSON();
  return {
    ...formatted,
    created_by_name: transaction.creator?.username
  };
};

const formatTransactions = (transactions) => {
  return transactions.map(t => ({
    ...t.toJSON(),
    created_by_name: t.creator?.username
  }));
};

const getAll = async (filters = {}) => {
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

  return formatTransactions(transactions);
};

const getById = async (id) => {
  const transaction = await Transaction.findByPk(id, {
    include: [{
      model: User,
      as: 'creator',
      attributes: ['id', 'username']
    }]
  });

  if (!transaction) return null;

  return formatTransaction(transaction);
};

const create = async (data, userId) => {
  const transaction = await Transaction.create({
    ...data,
    created_by: userId
  });
  
  return await getById(transaction.id);
};

const update = async (id, data) => {
  const transaction = await Transaction.findByPk(id);
  if (!transaction) return null;

  await transaction.update(data);
  return await getById(id);
};

const deleteTransaction = async (id) => {
  const transaction = await Transaction.findByPk(id);
  if (!transaction) return false;

  await transaction.destroy();
  return true;
};

const getSummary = async (filters = {}) => {
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
};

const getByCategory = async (filters = {}) => {
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
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  delete: deleteTransaction,
  getSummary,
  getByCategory
};
