const { body, param, query } = require('express-validator');

const validateAssignment = [
  body('staffId')
    .notEmpty()
    .withMessage('Staff ID is required')
    .isInt({ min: 1 })
    .withMessage('Staff ID must be a positive integer'),
    
  body('officeId')
    .notEmpty()
    .withMessage('Office ID is required')
    .isString()
    .withMessage('Office ID must be a string'),
    
  body('reason')
    .optional()
    .isString()
    .withMessage('Reason must be a string')
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters')
];

const validateAutoAssign = [
  body('complaintIds')
    .isArray({ min: 1 })
    .withMessage('Complaint IDs must be a non-empty array')
    .custom((value) => {
      if (!value.every(id => typeof id === 'string' || typeof id === 'number')) {
        throw new Error('All complaint IDs must be strings or numbers');
      }
      return true;
    })
];

const validateComplaintId = [
  param('complaintId')
    .notEmpty()
    .withMessage('Complaint ID is required')
    .isString()
    .withMessage('Complaint ID must be a string')
];

const validateStaffId = [
  param('staffId')
    .notEmpty()
    .withMessage('Staff ID is required')
    .isInt({ min: 1 })
    .withMessage('Staff ID must be a positive integer')
];

const validateOfficeId = [
  query('officeId')
    .notEmpty()
    .withMessage('Office ID is required')
    .isString()
    .withMessage('Office ID must be a string')
];

module.exports = {
  validateAssignment,
  validateAutoAssign,
  validateComplaintId,
  validateStaffId,
  validateOfficeId
};
