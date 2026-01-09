const { body } = require('express-validator');
const { TRANSACTION_TYPES } = require('../constants');

const validateTransaction = [
  body('type')
    .notEmpty()
    .withMessage('Type is required')
    .isIn(Object.values(TRANSACTION_TYPES))
    .withMessage(`Type must be one of: ${Object.values(TRANSACTION_TYPES).join(', ')}`),
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number greater than 0')
    .toFloat(),
  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Date must be a valid date (YYYY-MM-DD)')
    .toDate(),
  body('category')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Category must not exceed 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters')
];

module.exports = {
  validateTransaction
};

