const { ERROR_CODES, ERROR_MESSAGES } = require("../constants");
const ApiResponse = require("../utils/response");
const AppError = require("../utils/AppError");
const logger = require("../utils/logger");

const errorHandler = (err, req, res, next) => {
  logger.error("Error occurred", {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  if (err instanceof AppError) {
    return ApiResponse.error(res, err.errorCode, err.message, err.statusCode);
  }

  // Database errors
  if (err.code === "23505") {
    return ApiResponse.conflict(
      res,
      ERROR_CODES.USER_ALREADY_EXISTS,
      "Resource already exists",
    );
  }

  if (err.code === "23503") {
    return ApiResponse.error(
      res,
      ERROR_CODES.VALIDATION_ERROR,
      "Referenced resource does not exist",
    );
  }

  // Default error
  return ApiResponse.internalError(
    res,
    ERROR_CODES.INTERNAL_ERROR,
    ERROR_MESSAGES[ERROR_CODES.INTERNAL_ERROR],
  );
};

module.exports = errorHandler;
