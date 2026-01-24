const { body } = require('express-validator');
const { CONNECTION_STATUS } = require('../constants');

const validateConnection = [
  body('customer_id')
    .trim()
    .notEmpty()
    .withMessage('Customer ID is required')
    .isUUID()
    .withMessage('Invalid customer ID format. Must be a valid UUID'),
  body('connection_type')
    .trim()
    .notEmpty()
    .withMessage('Connection type is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Connection type must be between 2 and 100 characters'),
  body('installation_date')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (!value || value === null || value === '') return true;
      return /^\d{4}-\d{2}-\d{2}$/.test(value) || !isNaN(Date.parse(value));
    })
    .withMessage('Installation date must be a valid date (YYYY-MM-DD)'),
  body('activation_date')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (!value || value === null || value === '') return true;
      return /^\d{4}-\d{2}-\d{2}$/.test(value) || !isNaN(Date.parse(value));
    })
    .withMessage('Activation date must be a valid date (YYYY-MM-DD)'),
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

