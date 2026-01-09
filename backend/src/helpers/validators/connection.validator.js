const { body } = require('express-validator');
const { CONNECTION_STATUS } = require('../constants');

const validateConnection = [
  body('customer_id')
    .notEmpty()
    .withMessage('Customer ID is required')
    .isUUID()
    .withMessage('Invalid customer ID format'),
  body('connection_type')
    .trim()
    .notEmpty()
    .withMessage('Connection type is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Connection type must be between 2 and 100 characters'),
  body('installation_date')
    .optional()
    .isISO8601()
    .withMessage('Installation date must be a valid date (YYYY-MM-DD)')
    .toDate(),
  body('activation_date')
    .optional()
    .isISO8601()
    .withMessage('Activation date must be a valid date (YYYY-MM-DD)')
    .toDate(),
  body('status')
    .optional()
    .isIn(Object.values(CONNECTION_STATUS))
    .withMessage(`Status must be one of: ${Object.values(CONNECTION_STATUS).join(', ')}`),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Notes must not exceed 2000 characters')
];

module.exports = {
  validateConnection
};

