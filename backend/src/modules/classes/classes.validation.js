const { body } = require("express-validator");

const createClassValidation = [
  body("name")
    .notEmpty()
    .withMessage("Class name is required")
    .isLength({ min: 1, max: 50 })
    .withMessage("Class name must be between 1 and 50 characters"),

  body("section")
    .optional()
    .isLength({ max: 10 })
    .withMessage("Section must be at most 10 characters"),

  body("academicYearId")
    .notEmpty()
    .withMessage("Academic year ID is required")
    .isInt()
    .withMessage("Academic year ID must be an integer"),

  body("inchargeId")
    .optional()
    .isInt()
    .withMessage("Incharge ID must be an integer"),

  body("defaultFeeAmount")
    .optional()
    .isDecimal()
    .withMessage("Default fee amount must be a valid decimal number"),
];

const updateClassValidation = [
  body("name")
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage("Class name must be between 1 and 50 characters"),

  body("section")
    .optional()
    .isLength({ max: 10 })
    .withMessage("Section must be at most 10 characters"),

  body("inchargeId")
    .optional({ nullable: true })
    .custom((value) => {
      if (value !== null && value !== undefined && !Number.isInteger(Number(value))) {
        throw new Error("Incharge ID must be an integer or null");
      }
      return true;
    }),

  body("defaultFeeAmount")
    .optional()
    .isDecimal()
    .withMessage("Default fee amount must be a valid decimal number"),
];

module.exports = {
  createClassValidation,
  updateClassValidation,
};
