const { body } = require("express-validator");
const { EXAM_TYPES } = require("../../constants");

const createExamValidation = [
  body("classId")
    .notEmpty()
    .withMessage("Class ID is required")
    .isInt()
    .withMessage("Class ID must be an integer"),

  body("academicYearId")
    .notEmpty()
    .withMessage("Academic year ID is required")
    .isInt()
    .withMessage("Academic year ID must be an integer"),

  body("name")
    .notEmpty()
    .withMessage("Exam name is required")
    .isLength({ max: 100 })
    .withMessage("Exam name must be at most 100 characters"),

  body("examType")
    .optional()
    .isIn(EXAM_TYPES)
    .withMessage(`Exam type must be one of: ${EXAM_TYPES.join(", ")}`),

  body("startDate")
    .notEmpty()
    .withMessage("Start date is required")
    .isISO8601()
    .withMessage("Invalid date format, use ISO 8601 (YYYY-MM-DD)"),

  body("endDate")
    .notEmpty()
    .withMessage("End date is required")
    .isISO8601()
    .withMessage("Invalid date format, use ISO 8601 (YYYY-MM-DD)"),

  body("weightage")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Weightage must be between 0 and 100"),

  body("subjects")
    .optional()
    .isArray()
    .withMessage("Subjects must be an array"),

  body("subjects.*.subjectId")
    .optional()
    .isInt()
    .withMessage("Subject ID must be an integer"),

  body("subjects.*.maxMarks")
    .optional()
    .isFloat({ gt: 0 })
    .withMessage("Max marks must be a positive number"),

  body("subjects.*.examDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid date format, use ISO 8601 (YYYY-MM-DD)"),
];

const updateExamValidation = [
  body("name")
    .optional()
    .isLength({ max: 100 })
    .withMessage("Exam name must be at most 100 characters"),

  body("examType")
    .optional()
    .isIn(EXAM_TYPES)
    .withMessage(`Exam type must be one of: ${EXAM_TYPES.join(", ")}`),

  body("startDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid date format, use ISO 8601 (YYYY-MM-DD)"),

  body("endDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid date format, use ISO 8601 (YYYY-MM-DD)"),

  body("weightage")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Weightage must be between 0 and 100"),
];

const addExamSubjectValidation = [
  body("subjectId")
    .notEmpty()
    .withMessage("Subject ID is required")
    .isInt()
    .withMessage("Subject ID must be an integer"),

  body("maxMarks")
    .notEmpty()
    .withMessage("Max marks is required")
    .isFloat({ gt: 0 })
    .withMessage("Max marks must be a positive number"),

  body("examDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid date format, use ISO 8601 (YYYY-MM-DD)"),
];

const updateExamSubjectValidation = [
  body("maxMarks")
    .optional()
    .isFloat({ gt: 0 })
    .withMessage("Max marks must be a positive number"),

  body("examDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid date format, use ISO 8601 (YYYY-MM-DD)"),
];

module.exports = {
  createExamValidation,
  updateExamValidation,
  addExamSubjectValidation,
  updateExamSubjectValidation,
};
