const { body, query } = require("express-validator");

const createHolidayValidation = [
  body("holidayDate")
    .notEmpty()
    .withMessage("Holiday date is required")
    .isISO8601()
    .withMessage("Invalid date format, use ISO 8601 (YYYY-MM-DD)"),

  body("description")
    .optional()
    .isLength({ max: 200 })
    .withMessage("Description must be at most 200 characters"),

  body("academicYearId")
    .notEmpty()
    .withMessage("Academic year ID is required")
    .isInt()
    .withMessage("Academic year ID must be an integer"),
];

const updateHolidayValidation = [
  body("holidayDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid date format, use ISO 8601 (YYYY-MM-DD)"),

  body("description")
    .optional()
    .isLength({ max: 200 })
    .withMessage("Description must be at most 200 characters"),
];

const getWorkingDaysValidation = [
  query("startDate")
    .notEmpty()
    .withMessage("Start date is required")
    .isISO8601()
    .withMessage("Invalid date format, use ISO 8601 (YYYY-MM-DD)"),

  query("endDate")
    .notEmpty()
    .withMessage("End date is required")
    .isISO8601()
    .withMessage("Invalid date format, use ISO 8601 (YYYY-MM-DD)"),

  query("academicYearId")
    .optional()
    .isInt()
    .withMessage("Academic year ID must be an integer"),
];

module.exports = {
  createHolidayValidation,
  updateHolidayValidation,
  getWorkingDaysValidation,
};
