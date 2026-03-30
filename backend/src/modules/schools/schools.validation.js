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

const updateSchoolAdminValidation = [
  body("fullName")
    .optional()
    .isLength({ min: 3, max: 150 })
    .withMessage("Full name must be between 3 and 150 characters"),

  body("email")
    .optional()
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),

  body("phone")
    .optional()
    .isLength({ max: 20 })
    .withMessage("Phone must be at most 20 characters"),

  body("password")
    .optional()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
];

module.exports = {
  createSchoolValidation,
  updateSchoolValidation,
  updateSchoolAdminValidation,
};
