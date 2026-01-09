const { validationResult } = require('express-validator');
const ApiResponse = require('../helpers/responses');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return ApiResponse.validationError(res, errors.array());
  }
  next();
};

module.exports = { handleValidationErrors };

