const { body } = require("express-validator");

const createTeacherValidation = [
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

  body("phone")
    .optional()
    .isMobilePhone()
    .withMessage("Valid phone number is required"),

  body("dateOfBirth")
    .optional()
    .isISO8601()
    .withMessage("Valid date of birth is required"),

  body("gender")
    .optional()
    .isIn(["Male", "Female", "Other"])
    .withMessage("Gender must be Male, Female, or Other"),
];

module.exports = {
  createTeacherValidation,
};
