const { body } = require("express-validator");

const allocateTeacherValidation = [
  body("teacherId")
    .notEmpty()
    .withMessage("Teacher ID is required")
    .isInt()
    .withMessage("Teacher ID must be an integer"),

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
];

module.exports = {
  allocateTeacherValidation,
};
