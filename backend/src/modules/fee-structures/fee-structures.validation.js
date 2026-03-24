const { body } = require("express-validator");

const createFeeStructureValidation = [
  body("classId")
    .notEmpty()
    .withMessage("Class ID is required")
    .isInt()
    .withMessage("Class ID must be an integer"),

  body("academicYearId")
    .notEmpty()
    .withMessage("Academic year ID is required")
    .isInt()
    .withMessage("Academic year ID must be an integer"),

  body("feeType")
    .notEmpty()
    .withMessage("Fee type is required")
    .isLength({ max: 50 })
    .withMessage("Fee type must be at most 50 characters"),

  body("amount")
    .notEmpty()
    .withMessage("Amount is required")
    .isFloat({ gt: 0 })
    .withMessage("Amount must be a positive number"),

  body("termNumber")
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage("Term number must be between 1 and 12"),
];

const updateFeeStructureValidation = [
  body("amount")
    .optional()
    .isFloat({ gt: 0 })
    .withMessage("Amount must be a positive number"),

  body("feeType")
    .optional()
    .isLength({ max: 50 })
    .withMessage("Fee type must be at most 50 characters"),
];

module.exports = {
  createFeeStructureValidation,
  updateFeeStructureValidation,
};
