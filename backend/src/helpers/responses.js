const { HTTP_STATUS } = require('./constants');

class ApiResponse {
  static success(res, data = null, message = 'Success', statusCode = HTTP_STATUS.OK) {
    return res.status(statusCode).json({
      success: true,
      message,
      data
    });
  }

  static error(res, message = 'An error occurred', statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, errors = null) {
    const response = {
      success: false,
      message
    };

    if (errors) {
      response.errors = errors;
    }

    return res.status(statusCode).json(response);
  }

  static validationError(res, errors) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  static notFound(res, resource = 'Resource') {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: `${resource} not found`
    });
  }

  static unauthorized(res, message = 'Authentication required') {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message
    });
  }

  static forbidden(res, message = 'Insufficient permissions') {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message
    });
  }

  static conflict(res, message = 'This record already exists') {
    return res.status(HTTP_STATUS.CONFLICT).json({
      success: false,
      message
    });
  }
}

module.exports = ApiResponse;

