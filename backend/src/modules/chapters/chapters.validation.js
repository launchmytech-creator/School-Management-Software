const { body } = require("express-validator");

const createChapterValidation = [
  body("subjectId")
    .notEmpty()
    .withMessage("Subject ID is required")
    .isInt()
    .withMessage("Subject ID must be an integer"),

  body("name")
    .notEmpty()
    .withMessage("Chapter name is required")
    .isLength({ min: 2, max: 200 })
    .withMessage("Chapter name must be between 2 and 200 characters"),

  body("sequenceNumber")
    .optional()
    .isInt()
    .withMessage("Sequence number must be an integer"),
];

const updateChapterValidation = [
  body("name")
    .optional()
    .isLength({ min: 2, max: 200 })
    .withMessage("Chapter name must be between 2 and 200 characters"),

  body("sequenceNumber")
    .optional()
    .isInt()
    .withMessage("Sequence number must be an integer"),
];

module.exports = {
  createChapterValidation,
  updateChapterValidation,
};
