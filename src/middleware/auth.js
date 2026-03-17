const jwt = require("jsonwebtoken");
const config = require("../config");
const { ERROR_CODES, ERROR_MESSAGES, HTTP_STATUS } = require("../constants");
const ApiResponse = require("../utils/response");
const AppError = require("../utils/AppError");

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError(
        ERROR_CODES.AUTH_TOKEN_MISSING,
        ERROR_MESSAGES[ERROR_CODES.AUTH_TOKEN_MISSING],
        HTTP_STATUS.UNAUTHORIZED,
      );
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      req.user = decoded;
      next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        throw new AppError(
          ERROR_CODES.AUTH_TOKEN_EXPIRED,
          ERROR_MESSAGES[ERROR_CODES.AUTH_TOKEN_EXPIRED],
          HTTP_STATUS.UNAUTHORIZED,
        );
      }
      throw new AppError(
        ERROR_CODES.AUTH_TOKEN_INVALID,
        ERROR_MESSAGES[ERROR_CODES.AUTH_TOKEN_INVALID],
        HTTP_STATUS.UNAUTHORIZED,
      );
    }
  } catch (error) {
    if (error instanceof AppError) {
      return ApiResponse.unauthorized(res, error.errorCode, error.message);
    }
    return ApiResponse.internalError(
      res,
      ERROR_CODES.INTERNAL_ERROR,
      ERROR_MESSAGES[ERROR_CODES.INTERNAL_ERROR],
    );
  }
};

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.unauthorized(
        res,
        ERROR_CODES.AUTH_UNAUTHORIZED,
        ERROR_MESSAGES[ERROR_CODES.AUTH_UNAUTHORIZED],
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return ApiResponse.forbidden(
        res,
        ERROR_CODES.AUTH_UNAUTHORIZED,
        "You do not have permission to access this resource",
      );
    }

    next();
  };
};

module.exports = { authenticate, authorize };
