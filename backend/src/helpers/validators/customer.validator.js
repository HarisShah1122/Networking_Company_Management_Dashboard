const { body } = require('express-validator');
const { CUSTOMER_STATUS } = require('../constants');

const validateCustomer = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 255 })
    .withMessage('Name must be between 2 and 255 characters'),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone is required')
    .isLength({ min: 10, max: 20 })
    .withMessage('Phone must be between 10 and 20 characters')
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
    .withMessage('Invalid phone number format'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Address must not exceed 1000 characters'),
  body('father_name')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Father name must not exceed 255 characters'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),
  body('whatsapp_number')
    .optional()
    .trim()
    .isLength({ min: 10, max: 20 })
    .withMessage('WhatsApp number must be between 10 and 20 characters')
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
    .withMessage('Invalid WhatsApp number format'),
  body('status')
    .optional()
    .isIn(Object.values(CUSTOMER_STATUS))
    .withMessage(`Status must be one of: ${Object.values(CUSTOMER_STATUS).join(', ')}`)
];

module.exports = {
  validateCustomer
};

