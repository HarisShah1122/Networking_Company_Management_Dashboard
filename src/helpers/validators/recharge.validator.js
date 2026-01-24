const { body } = require('express-validator');
const { RECHARGE_STATUS, PAYMENT_METHODS } = require('../constants');

const validateRecharge = [
  body('customer_id')
    .optional({ nullable: true, checkFalsy: true })
    .notEmpty()
    .withMessage('Customer ID is required')
    .isUUID()
    .withMessage('Invalid customer ID format'),
  body('amount')
    .optional({ nullable: true, checkFalsy: true })
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number greater than 0')
    .toFloat(),
  body('payment_method')
    .optional()
    .isIn(Object.values(PAYMENT_METHODS))
    .withMessage(`Payment method must be one of: ${Object.values(PAYMENT_METHODS).join(', ')}`),
  body('due_date')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid date (YYYY-MM-DD)')
    .toDate(),
  body('status')
    .optional()
    .isIn(Object.values(RECHARGE_STATUS))
    .withMessage(`Status must be one of: ${Object.values(RECHARGE_STATUS).join(', ')}`),
  body('payment_date')
    .optional()
    .isISO8601()
    .withMessage('Payment date must be a valid date (YYYY-MM-DD)')
    .toDate(),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Notes must not exceed 2000 characters'),
  body('package')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Package must not exceed 255 characters')
];

module.exports = {
  validateRecharge
};

