const { body } = require("express-validator");

const markCompletionValidation = [
  body("classSubjectId")
    .notEmpty()
    .withMessage("Class subject ID is required")
    .isInt()
    .withMessage("Class subject ID must be an integer"),

  body("chapters")
    .notEmpty()
    .withMessage("Chapters are required")
    .isArray({ min: 1 })
    .withMessage("Chapters must be a non-empty array"),

  body("chapters.*.chapterId")
    .notEmpty()
    .withMessage("Chapter ID is required")
    .isInt()
    .withMessage("Chapter ID must be an integer"),

  body("chapters.*.status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["pending", "in_progress", "completed"])
    .withMessage("Status must be one of: pending, in_progress, completed"),
];

module.exports = {
  markCompletionValidation,
};
