const { body } = require("express-validator");

const createSubjectValidation = [
  body("name")
    .notEmpty()
    .withMessage("Subject name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Subject name must be between 2 and 100 characters"),

  body("code")
    .notEmpty()
    .withMessage("Subject code is required")
    .isLength({ min: 2, max: 20 })
    .withMessage("Subject code must be between 2 and 20 characters"),
];

const updateSubjectValidation = [
  body("name")
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage("Subject name must be between 2 and 100 characters"),

  body("code")
    .optional()
    .isLength({ min: 2, max: 20 })
    .withMessage("Subject code must be between 2 and 20 characters"),
];

module.exports = {
  createSubjectValidation,
  updateSubjectValidation,
};
