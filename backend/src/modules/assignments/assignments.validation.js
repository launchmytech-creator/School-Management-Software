const { body, param } = require("express-validator");

const createAssignmentValidation = [
  body("classId")
    .notEmpty()
    .withMessage("Class ID is required")
    .isInt()
    .withMessage("Class ID must be an integer"),

  body("subjectId")
    .notEmpty()
    .withMessage("Subject ID is required")
    .isInt()
    .withMessage("Subject ID must be an integer"),

  body("academicYearId")
    .notEmpty()
    .withMessage("Academic year ID is required")
    .isInt()
    .withMessage("Academic year ID must be an integer"),

  body("title")
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ max: 200 })
    .withMessage("Title must be at most 200 characters"),

  body("description")
    .optional()
    .isLength({ max: 2000 })
    .withMessage("Description must be at most 2000 characters"),

  body("dueDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid due date format"),

  body("maxMarks")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Max marks must be at least 1"),

  body("assignmentType")
    .optional()
    .isIn(["homework", "classwork", "project", "quiz", "test"])
    .withMessage("Invalid assignment type"),
];

const updateAssignmentValidation = [
  body("title")
    .optional()
    .isLength({ max: 200 })
    .withMessage("Title must be at most 200 characters"),

  body("description")
    .optional()
    .isLength({ max: 2000 })
    .withMessage("Description must be at most 2000 characters"),

  body("dueDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid due date format"),

  body("maxMarks")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Max marks must be at least 1"),

  body("assignmentType")
    .optional()
    .isIn(["homework", "classwork", "project", "quiz", "test"])
    .withMessage("Invalid assignment type"),
];

const gradeSubmissionValidation = [
  body("marksObtained")
    .notEmpty()
    .withMessage("Marks obtained is required")
    .isInt({ min: 0 })
    .withMessage("Marks must be a positive number"),

  body("feedback")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Feedback must be at most 500 characters"),
];

const assignmentIdValidation = [
  param("id")
    .isInt()
    .withMessage("Assignment ID must be an integer"),
];

module.exports = {
  createAssignmentValidation,
  updateAssignmentValidation,
  gradeSubmissionValidation,
  assignmentIdValidation,
};
