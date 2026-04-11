const { query } = require("express-validator");

const getReportValidation = [
  query("type")
    .notEmpty()
    .withMessage("Report type is required")
    .isIn(["attendance", "fees", "results", "summary"])
    .withMessage("Invalid report type"),

  query("academicYearId")
    .optional()
    .isInt()
    .withMessage("Academic year ID must be an integer"),

  query("classId")
    .optional()
    .isInt()
    .withMessage("Class ID must be an integer"),

  query("startDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid start date format"),

  query("endDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid end date format"),
];

module.exports = {
  getReportValidation,
};
