const { body } = require("express-validator");

const promoteStudentsValidation = [
  body("studentIds")
    .notEmpty()
    .withMessage("Student IDs are required")
    .isArray({ min: 1 })
    .withMessage("Student IDs must be a non-empty array"),

  body("studentIds.*")
    .isInt()
    .withMessage("Each student ID must be an integer"),

  body("toClassId")
    .notEmpty()
    .withMessage("To class ID is required")
    .isInt()
    .withMessage("To class ID must be an integer"),

  body("toAcademicYearId")
    .notEmpty()
    .withMessage("To academic year ID is required")
    .isInt()
    .withMessage("To academic year ID must be an integer"),

  body("promotionDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid date format, use ISO 8601 (YYYY-MM-DD)"),
];

module.exports = {
  promoteStudentsValidation,
};
