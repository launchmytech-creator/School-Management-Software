const { validationResult } = require("express-validator");
const { ERROR_CODES } = require("../constants");
const ApiResponse = require("../utils/response");

const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));

    return ApiResponse.error(
      res,
      ERROR_CODES.VALIDATION_ERROR,
      "Validation failed",
      400,
      formattedErrors,
    );
  }

  next();
};

module.exports = validate;
