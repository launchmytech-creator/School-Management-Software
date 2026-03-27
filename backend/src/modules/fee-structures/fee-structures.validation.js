const { body } = require("express-validator");

const createFeeStructureValidation = [
  body("classId")
    .notEmpty().withMessage("Class ID is required")
    .isInt().withMessage("Class ID must be an integer"),

  body("academicYearId")
    .notEmpty().withMessage("Academic year ID is required")
    .isInt().withMessage("Academic year ID must be an integer"),

  body("feeTerms")
    .notEmpty().withMessage("Fee terms is required")
    .isIn([1, 2, 4, 12])
    .withMessage("Fee terms must be 1 (yearly), 2 (half-yearly), 4 (quarterly), or 12 (monthly)"),

  body("feeType")
    .notEmpty().withMessage("Fee type is required")
    .isLength({ max: 50 }).withMessage("Fee type must be at most 50 characters"),

  body("amount")
    .notEmpty().withMessage("Amount is required")
    .isFloat({ gt: 0 }).withMessage("Amount must be a positive number (annual amount for this fee type)"),
];

const updateFeeStructureValidation = [
  body("amount")
    .optional()
    .isFloat({ gt: 0 }).withMessage("Amount must be a positive number"),

  body("feeType")
    .optional()
    .isLength({ max: 50 }).withMessage("Fee type must be at most 50 characters"),
];

module.exports = { createFeeStructureValidation, updateFeeStructureValidation };
