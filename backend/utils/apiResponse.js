const { StatusCodes } = require('http-status-codes');
const logger = require('./logger');

/**
 * Standard API response format
 */
class ApiResponse {
  /**
   * Successful API response
   * @param {Object} res - Express response object
   * @param {Object} data - Data to be sent with the response
   * @param {String} message - Response message (optional)
   * @param {Number} statusCode - HTTP status code (default: 200)
   */
  static success(res, data, message = 'Success', statusCode = StatusCodes.OK) {
    return res.status(statusCode).json({
      success: true,
      status: 'success',
      message,
      data
    });
  }

  /**
   * Failed API response
   * @param {Object} res - Express response object
   * @param {String} message - Error message
   * @param {Number} statusCode - HTTP status code (default: 400)
   * @param {Object} errors - Detailed error information (optional)
   */
  static error(res, message, statusCode = StatusCodes.BAD_REQUEST, errors = null) {
    const response = {
      success: false,
      status: 'error',
      code: statusCode,
      message
    };

    if (errors) {
      response.errors = errors;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Resource not found response
   * @param {Object} res - Express response object
   * @param {String} message - Error message (default: 'Resource not found')
   */
  static notFound(res, message = 'Resource not found') {
    return this.error(res, message, StatusCodes.NOT_FOUND);
  }

  /**
   * Server error response
   * @param {Object} res - Express response object
   * @param {Error} error - Error object
   * @param {String} message - Error message (default: 'Internal server error')
   */
  static serverError(res, error, message = 'Internal server error') {
    logger.error(`Server Error: ${error.message}`);
    logger.error(error.stack);
    
    return this.error(res, message, StatusCodes.INTERNAL_SERVER_ERROR);
  }

  /**
   * Bad request response
   * @param {Object} res - Express response object
   * @param {String} message - Error message (default: 'Bad request')
   * @param {Object} errors - Validation errors (optional)
   */
  static badRequest(res, message = 'Bad request', errors = null) {
    return this.error(res, message, StatusCodes.BAD_REQUEST, errors);
  }
}

module.exports = ApiResponse; 