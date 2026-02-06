const { body } = require('express-validator');

const validateStatusUpdate = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['open', 'in_progress', 'on_hold', 'resolved', 'closed'])
    .withMessage('Status must be open, in_progress, on_hold, resolved, or closed')
];

module.exports = {
  validateStatusUpdate
};
