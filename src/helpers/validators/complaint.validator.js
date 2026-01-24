const { body } = require('express-validator');

const validateComplaint = [
  body('customerId')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (!value || value === '' || value === 'null' || value === 'undefined') {
        return true; // Allow null/empty
      }
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidRegex.test(value);
    })
    .withMessage('Invalid customer ID format'),
  body('connectionId')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (!value || value === '' || value === 'null' || value === 'undefined') {
        return true; // Allow null/empty
      }
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidRegex.test(value);
    })
    .withMessage('Invalid connection ID format'),
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('Title must be between 3 and 255 characters'),
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Description must be between 10 and 5000 characters'),
  body('status')
    .optional()
    .isIn(['open', 'in_progress', 'resolved', 'closed'])
    .withMessage('Status must be open, in_progress, resolved, or closed'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be low, medium, high, or urgent'),
  body('name')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 255 })
    .withMessage('Name must not exceed 255 characters'),
  body('address')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Address must not exceed 1000 characters'),
  body('whatsapp_number')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (!value || value === '' || value === 'null' || value === 'undefined') {
        return true; // Allow null/empty
      }
      const trimmed = String(value).trim();
      if (trimmed.length < 10 || trimmed.length > 20) {
        return false;
      }
      return true;
    })
    .withMessage('WhatsApp number must be between 10 and 20 characters if provided')
];

module.exports = {
  validateComplaint
};

