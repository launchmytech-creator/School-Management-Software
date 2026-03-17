const { body } = require("express-validator");

const createSchoolValidation = [
  body("school.name")
    .notEmpty()
    .withMessage("School name is required")
    .isLength({ min: 3, max: 200 })
    .withMessage("School name must be between 3 and 200 characters"),

  body("school.code")
    .notEmpty()
    .withMessage("School code is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("School code must be between 2 and 50 characters"),

  body("school.subscriptionPlanId")
    .optional()
    .isInt({ min: 1, max: 3 })
    .withMessage(
      "Subscription plan ID must be 1 (Basic), 2 (Premium), or 3 (Business)",
    ),

  body("school.feeTerms")
    .optional()
    .isIn([1, 2, 4, 12])
    .withMessage(
      "Fee terms must be 1 (yearly), 2 (half-yearly), 4 (quarterly), or 12 (monthly)",
    ),

  body("school.contactEmail")
    .isEmail()
    .withMessage("Valid contact email is required")
    .normalizeEmail(),

  body("admin.email")
    .isEmail()
    .withMessage("Valid admin email is required")
    .normalizeEmail(),

  body("admin.password")
    .isLength({ min: 8 })
    .withMessage("Admin password must be at least 8 characters"),

  body("admin.fullName")
    .notEmpty()
    .withMessage("Admin full name is required")
    .isLength({ min: 3, max: 150 })
    .withMessage("Admin full name must be between 3 and 150 characters"),
];

const updateSchoolValidation = [
  body("name")
    .optional()
    .isLength({ min: 3, max: 200 })
    .withMessage("School name must be between 3 and 200 characters"),

  body("subscriptionPlanId")
    .optional()
    .isInt({ min: 1, max: 3 })
    .withMessage(
      "Subscription plan ID must be 1 (Basic), 2 (Premium), or 3 (Business)",
    ),

  body("feeTerms")
    .optional()
    .isIn([1, 2, 4, 12])
    .withMessage(
      "Fee terms must be 1 (yearly), 2 (half-yearly), 4 (quarterly), or 12 (monthly)",
    ),

  body("subscriptionStatus")
    .optional()
    .isIn(["active", "suspended", "expired", "trial"])
    .withMessage("Invalid subscription status"),

  body("contactEmail")
    .optional()
    .isEmail()
    .withMessage("Valid contact email is required")
    .normalizeEmail(),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
];

module.exports = {
  createSchoolValidation,
  updateSchoolValidation,
};
