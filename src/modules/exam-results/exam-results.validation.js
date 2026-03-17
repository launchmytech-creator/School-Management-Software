const { body } = require("express-validator");

const enterMarksValidation = [
  body("examSubjectId")
    .notEmpty()
    .withMessage("Exam subject ID is required")
    .isInt()
    .withMessage("Exam subject ID must be an integer"),

  body("results")
    .notEmpty()
    .withMessage("Results are required")
    .isArray({ min: 1 })
    .withMessage("Results must be a non-empty array"),

  body("results.*.studentId")
    .notEmpty()
    .withMessage("Student ID is required")
    .isInt()
    .withMessage("Student ID must be an integer"),

  body("results.*.marksObtained")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Marks obtained must be a non-negative number"),

  body("results.*.grade")
    .optional()
    .isLength({ max: 5 })
    .withMessage("Grade must be at most 5 characters"),

  body("results.*.isAbsent")
    .optional()
    .isBoolean()
    .withMessage("Is absent must be a boolean"),
];

module.exports = {
  enterMarksValidation,
};
