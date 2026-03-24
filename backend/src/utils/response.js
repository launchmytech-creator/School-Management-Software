const { HTTP_STATUS } = require("../constants");

class ApiResponse {
  static success(
    res,
    data = null,
    message = "Success",
    statusCode = HTTP_STATUS.OK,
  ) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  static error(
    res,
    errorCode,
    message,
    statusCode = HTTP_STATUS.BAD_REQUEST,
    errors = null,
  ) {
    const response = {
      success: false,
      errorCode,
      message,
    };

    if (errors) {
      response.errors = errors;
    }

    return res.status(statusCode).json(response);
  }

  static created(res, data, message = "Resource created successfully") {
    return this.success(res, data, message, HTTP_STATUS.CREATED);
  }

  static unauthorized(res, errorCode, message) {
    return this.error(res, errorCode, message, HTTP_STATUS.UNAUTHORIZED);
  }

  static forbidden(res, errorCode, message) {
    return this.error(res, errorCode, message, HTTP_STATUS.FORBIDDEN);
  }

  static notFound(res, errorCode, message) {
    return this.error(res, errorCode, message, HTTP_STATUS.NOT_FOUND);
  }

  static conflict(res, errorCode, message) {
    return this.error(res, errorCode, message, HTTP_STATUS.CONFLICT);
  }

  static internalError(res, errorCode, message) {
    return this.error(
      res,
      errorCode,
      message,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }
}

module.exports = ApiResponse;
