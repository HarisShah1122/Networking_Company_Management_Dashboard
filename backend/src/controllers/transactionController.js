const ApiResponse = require('../helpers/responses');
const { Transaction } = require('../models');
const Sequelize = require('sequelize');
const { Op } = Sequelize;


const getAll = async (req, res) => {
  try {
    const { type } = req.query;

    const where = {};
    if (type) where.type = type;
    if (req.companyId) where.company_id = req.companyId;

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
    const transaction = await Transaction.findOne({
      where: {
        id: req.params.id,
        company_id: req.companyId
      }
    });

    if (!transaction)
      return ApiResponse.error(res, 'Transaction not found', 404);

    return ApiResponse.success(res, transaction);
  } catch (error) {
    return ApiResponse.error(res, error.message, 500);
  }
};


const getSummary = async (req, res) => {
  try {
    const whereClause = req.companyId ? { company_id: req.companyId } : {};
    
    const summaryResult = await Transaction.findOne({
      where: whereClause,
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
    const whereClause = {
      date: {
        [Op.gte]: Sequelize.literal('DATE_SUB(CURDATE(), INTERVAL 6 MONTH)')
      }
    };
    if (req.companyId) whereClause.company_id = req.companyId;

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
      where: whereClause,
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

    // Validation is handled by middleware, but double-check critical fields
    if (!type || !amount || !date || !trxId) {
      return ApiResponse.error(res, 'Required fields: type, amount, date, trxId', 422);
    }

    const transactionData = {
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
    };

    // Add company_id if available
    if (req.companyId) {
      transactionData.company_id = req.companyId;
    }

    const transaction = await Transaction.create(transactionData);

    return ApiResponse.success(
      res,
      transaction,
      'Transaction created successfully',
      201
    );
  } catch (error) {
    console.error('Transaction creation error:', error);
    
    // Handle specific validation errors
    if (error.name === 'SequelizeUniqueConstraintError') {
      return ApiResponse.error(res, 'TRX ID already exists', 409);
    }
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(e => e.message);
      return ApiResponse.error(res, messages.join(', '), 422);
    }
    
    return ApiResponse.error(res, error.message || 'Failed to create transaction', 500);
  }
};


const update = async (req, res) => {
  try {
    const whereClause = { id: req.params.id };
    if (req.companyId) {
      whereClause.company_id = req.companyId;
    }

    const transaction = await Transaction.findOne({ where: whereClause });

    if (!transaction)
      return ApiResponse.error(res, 'Transaction not found', 404);

    const updateData = { ...req.body };
    if (req.file) {
      updateData.receiptImage = `/uploads/receipts/${req.file.filename}`;
    }

    await transaction.update(updateData);

    return ApiResponse.success(
      res,
      transaction,
      'Transaction updated successfully'
    );
  } catch (error) {
    console.error('Transaction update error:', error);
    
    // Handle specific validation errors
    if (error.name === 'SequelizeUniqueConstraintError') {
      return ApiResponse.error(res, 'TRX ID already exists', 409);
    }
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(e => e.message);
      return ApiResponse.error(res, messages.join(', '), 422);
    }
    
    return ApiResponse.error(res, error.message || 'Failed to update transaction', 500);
  }
};


const searchTrx = async (req, res) => {
  try {
    const { query } = req.query;
    const whereClause = {
      trxId: { [Op.like]: `%${query}%` }
    };
    if (req.companyId) whereClause.company_id = req.companyId;

    const suggestions = await Transaction.findAll({
      where: whereClause,
      attributes: ['trxId'],
      limit: 5,
      raw: true
    });

    const existsWhere = { trxId: query };
    if (req.companyId) existsWhere.company_id = req.companyId;
    
    const exists = await Transaction.findOne({
      where: existsWhere
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
