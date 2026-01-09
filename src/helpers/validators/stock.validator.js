const { body } = require('express-validator');

const validateStock = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 255 })
    .withMessage('Name must be between 2 and 255 characters'),
  body('category')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Category must not exceed 100 characters'),
  body('quantity_available')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Available quantity must be a non-negative integer')
    .toInt(),
  body('quantity_used')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Used quantity must be a non-negative integer')
    .toInt(),
  body('unit_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Unit price must be a non-negative number')
    .toFloat(),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters')
];

module.exports = {
  validateStock
};

