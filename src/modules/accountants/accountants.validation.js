const { body } = require("express-validator");

const createAccountantValidation = [
  body("email")
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),

  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),

  body("fullName")
    .notEmpty()
    .withMessage("Full name is required")
    .isLength({ min: 3, max: 150 })
    .withMessage("Full name must be between 3 and 150 characters"),

  body("phone").optional().isMobilePhone().withMessage("Invalid phone number"),

  body("dateOfBirth").optional().isDate().withMessage("Invalid date of birth"),

  body("gender")
    .optional()
    .isIn(["Male", "Female", "Other"])
    .withMessage("Gender must be Male, Female, or Other"),
];

const updateAccountantValidation = [
  body("fullName")
    .optional()
    .isLength({ min: 3, max: 150 })
    .withMessage("Full name must be between 3 and 150 characters"),

  body("phone").optional().isMobilePhone().withMessage("Invalid phone number"),

  body("dateOfBirth").optional().isDate().withMessage("Invalid date of birth"),

  body("gender")
    .optional()
    .isIn(["Male", "Female", "Other"])
    .withMessage("Gender must be Male, Female, or Other"),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
];

module.exports = {
  createAccountantValidation,
  updateAccountantValidation,
};
