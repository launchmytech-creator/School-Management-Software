const { body } = require("express-validator");

const createStudentValidation = [
  body("admissionNumber")
    .notEmpty()
    .withMessage("Admission number is required")
    .isLength({ min: 1, max: 50 })
    .withMessage("Admission number must be between 1 and 50 characters"),

  body("fullName")
    .notEmpty()
    .withMessage("Full name is required")
    .isLength({ min: 3, max: 150 })
    .withMessage("Full name must be between 3 and 150 characters"),

  body("dateOfBirth").optional().isDate().withMessage("Invalid date of birth"),

  body("gender")
    .optional()
    .isIn(["male", "female", "other"])
    .withMessage("Gender must be male, female, or other"),

  body("admissionDate")
    .notEmpty()
    .withMessage("Admission date is required")
    .isDate()
    .withMessage("Invalid admission date"),

  body("currentClassId")
    .optional()
    .isInt()
    .withMessage("Class ID must be an integer"),

  body("parentId")
    .optional()
    .isInt()
    .withMessage("Parent ID must be an integer"),

  body("rollNumber")
    .optional()
    .isLength({ max: 20 })
    .withMessage("Roll number must be at most 20 characters"),

  body("status")
    .optional()
    .isIn(["active", "inactive", "transferred", "graduated"])
    .withMessage("Invalid status"),
];

const updateStudentValidation = [
  body("fullName")
    .optional()
    .isLength({ min: 3, max: 150 })
    .withMessage("Full name must be between 3 and 150 characters"),

  body("dateOfBirth").optional().isDate().withMessage("Invalid date of birth"),

  body("gender")
    .optional()
    .isIn(["male", "female", "other"])
    .withMessage("Gender must be male, female, or other"),

  body("currentClassId")
    .optional()
    .isInt()
    .withMessage("Class ID must be an integer"),

  body("parentId")
    .optional()
    .isInt()
    .withMessage("Parent ID must be an integer"),

  body("rollNumber")
    .optional()
    .isLength({ max: 20 })
    .withMessage("Roll number must be at most 20 characters"),

  body("status")
    .optional()
    .isIn(["active", "inactive", "transferred", "graduated"])
    .withMessage("Invalid status"),
];

module.exports = {
  createStudentValidation,
  updateStudentValidation,
};
