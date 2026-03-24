const { body } = require("express-validator");

const createAcademicYearValidation = [
  body("yearName")
    .notEmpty()
    .withMessage("Year name is required")
    .isLength({ min: 4, max: 20 })
    .withMessage("Year name must be between 4 and 20 characters")
    .matches(/^\d{4}-\d{4}$/)
    .withMessage("Year name must be in format YYYY-YYYY (e.g., 2024-2025)"),

  body("startDate")
    .notEmpty()
    .withMessage("Start date is required")
    .isDate()
    .withMessage("Invalid start date"),

  body("endDate")
    .notEmpty()
    .withMessage("End date is required")
    .isDate()
    .withMessage("Invalid end date")
    .custom((endDate, { req }) => {
      if (new Date(endDate) <= new Date(req.body.startDate)) {
        throw new Error("End date must be after start date");
      }
      return true;
    }),

  body("isCurrent")
    .optional()
    .isBoolean()
    .withMessage("isCurrent must be a boolean"),
];

const updateAcademicYearValidation = [
  body("yearName")
    .optional()
    .isLength({ min: 4, max: 20 })
    .withMessage("Year name must be between 4 and 20 characters")
    .matches(/^\d{4}-\d{4}$/)
    .withMessage("Year name must be in format YYYY-YYYY (e.g., 2024-2025)"),

  body("startDate").optional().isDate().withMessage("Invalid start date"),

  body("endDate")
    .optional()
    .isDate()
    .withMessage("Invalid end date")
    .custom((endDate, { req }) => {
      if (
        req.body.startDate &&
        new Date(endDate) <= new Date(req.body.startDate)
      ) {
        throw new Error("End date must be after start date");
      }
      return true;
    }),

  body("isCurrent")
    .optional()
    .isBoolean()
    .withMessage("isCurrent must be a boolean"),
];

module.exports = {
  createAcademicYearValidation,
  updateAcademicYearValidation,
};
