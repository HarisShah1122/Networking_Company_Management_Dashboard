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
      response.errors = Array.isArray(errors) ? errors : [errors];
    }

    return res.status(statusCode).json(response);
  }

  static validationError(res, errors) {
    // Format for frontend dirty forms: { field, message }
    const formattedErrors = errors.map(err => ({
      field: err.param || err.path || 'unknown',
      message: err.msg || err.message || 'Invalid value'
    }));

    return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY || 422).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors
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

  static paginated(res, data = [], pagination = {}, message = 'Data retrieved successfully', statusCode = HTTP_STATUS.OK) {
    const page = parseInt(pagination.page) || 1;
    const limit = parseInt(pagination.limit) || 10;
    const total = pagination.total || 0;
    const totalPages = Math.ceil(total / limit);

    return res.status(statusCode).json({
      success: true,
      message,
      data,
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1
      }
    });
  }
}

module.exports = ApiResponse;