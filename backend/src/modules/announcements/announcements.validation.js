const { body } = require("express-validator");

const createAnnouncementValidation = [
  body("title")
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ min: 5, max: 200 })
    .withMessage("Title must be between 5 and 200 characters"),

  body("message")
    .notEmpty()
    .withMessage("Message is required")
    .isLength({ min: 10, max: 2000 })
    .withMessage("Message must be between 10 and 2000 characters"),

  body("targetRole")
    .optional()
    .isIn(["school_admin", "teacher", "parent", "accountant"])
    .withMessage("Invalid target role"),
];

const updateAnnouncementValidation = [
  body("title")
    .optional()
    .isLength({ min: 5, max: 200 })
    .withMessage("Title must be between 5 and 200 characters"),

  body("message")
    .optional()
    .isLength({ min: 10, max: 2000 })
    .withMessage("Message must be between 10 and 2000 characters"),

  body("targetRole")
    .optional()
    .isIn(["school_admin", "teacher", "parent", "accountant"])
    .withMessage("Invalid target role"),
];

module.exports = {
  createAnnouncementValidation,
  updateAnnouncementValidation,
};
