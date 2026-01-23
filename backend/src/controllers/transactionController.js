const ApiResponse = require('../helpers/responses');
const { Transaction } = require('../models');
const Sequelize = require('sequelize');
const { Op } = Sequelize;


const getAll = async (req, res) => {
  try {
    const { type } = req.query;

    const where = {};
    if (type) where.type = type;

    const transactions = await Transaction.findAll({
      where,
      order: [['date', 'DESC']],
    });

    return ApiResponse.success(
      res,
      { transactions },
      'Transactions fetched successfully'
    );
  } catch (error) {
    return ApiResponse.error(res, error.message, 500);
  }
};


const getById = async (req, res) => {
  try {
    const transaction = await Transaction.findByPk(req.params.id);

    if (!transaction)
      return ApiResponse.error(res, 'Transaction not found', 404);

    return ApiResponse.success(res, transaction);
  } catch (error) {
    return ApiResponse.error(res, error.message, 500);
  }
};


const getSummary = async (req, res) => {
  try {
    const summaryResult = await Transaction.findOne({
      attributes: [
        [
          Sequelize.fn(
            'SUM',
            Sequelize.literal("CASE WHEN type='income' THEN amount ELSE 0 END")
          ),
          'total_income'
        ],
        [
          Sequelize.fn(
            'SUM',
            Sequelize.literal("CASE WHEN type='expense' THEN amount ELSE 0 END")
          ),
          'total_expense'
        ]
      ],
      raw: true
    });

    const total_income = Number(summaryResult?.total_income || 0);
    const total_expense = Number(summaryResult?.total_expense || 0);
    const profit_loss = total_income - total_expense;

    return ApiResponse.success(res, {
      summary: { total_income, total_expense, profit_loss }
    });
  } catch (error) {
    return ApiResponse.error(res, error.message, 500);
  }
};


const getRevenueGrowth = async (req, res) => {
  try {
    const revenue = await Transaction.findAll({
      attributes: [
        [Sequelize.fn('DATE_FORMAT', Sequelize.col('date'), '%Y-%m'), 'month'],
        [
          Sequelize.fn(
            'SUM',
            Sequelize.literal("CASE WHEN type='income' THEN amount ELSE 0 END")
          ),
          'revenue'
        ]
      ],
      where: {
        date: {
          [Op.gte]: Sequelize.literal('DATE_SUB(CURDATE(), INTERVAL 6 MONTH)')
        }
      },
      group: ['month'],
      order: [['month', 'ASC']],
      raw: true
    });

    return ApiResponse.success(res, { data: revenue });
  } catch (error) {
    return ApiResponse.error(res, error.message, 500);
  }
};


const create = async (req, res) => {
  try {
    const {
      type,
      amount,
      date,
      category,
      description,
      trxId
    } = req.body;

    if (!type || !amount || !date || !trxId) {
      return ApiResponse.error(res, 'Required fields missing', 422);
    }

    const transaction = await Transaction.create({
      type,
      amount,
      date,
      category,
      description,
      trxId,
      receiptImage: req.file
        ? `/uploads/receipts/${req.file.filename}`
        : null,
      created_by: req.user?.id || null,
    });

    return ApiResponse.success(
      res,
      transaction,
      'Transaction created successfully',
      201
    );
  } catch (error) {
    console.error(error);
    return ApiResponse.error(res, error.message, 400);
  }
};


const update = async (req, res) => {
  try {
    const transaction = await Transaction.findByPk(req.params.id);

    if (!transaction)
      return ApiResponse.error(res, 'Transaction not found', 404);

    await transaction.update({
      ...req.body,
      receiptImage: req.file
        ? `/uploads/receipts/${req.file.filename}`
        : transaction.receiptImage
    });

    return ApiResponse.success(
      res,
      transaction,
      'Transaction updated successfully'
    );
  } catch (error) {
    return ApiResponse.error(res, error.message, 400);
  }
};


const searchTrx = async (req, res) => {
  try {
    const { query } = req.query;

    const suggestions = await Transaction.findAll({
      where: {
        trxId: { [Op.like]: `%${query}%` }
      },
      attributes: ['trxId'],
      limit: 5,
      raw: true
    });

    const exists = await Transaction.findOne({
      where: { trxId: query }
    });

    return ApiResponse.success(res, {
      suggestions: suggestions.map(s => s.trxId),
      existing: !!exists
    });
  } catch (error) {
    return ApiResponse.error(res, error.message, 500);
  }
};

module.exports = {
  getAll,
  getById,
  getSummary,
  getRevenueGrowth,
  create,
  update,
  searchTrx
};
