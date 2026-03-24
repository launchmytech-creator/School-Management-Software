const { body } = require("express-validator");

const assignSubjectValidation = [
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

  body("maxMarks")
    .optional()
    .isDecimal()
    .withMessage("Max marks must be a valid decimal number"),
];

const updateClassSubjectValidation = [
  body("maxMarks")
    .optional()
    .isDecimal()
    .withMessage("Max marks must be a valid decimal number"),
];

module.exports = {
  assignSubjectValidation,
  updateClassSubjectValidation,
};
