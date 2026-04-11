const { body } = require("express-validator");

const updateSettingsValidation = [
  body("schoolName")
    .optional()
    .isLength({ max: 200 })
    .withMessage("School name must be at most 200 characters"),

  body("contactEmail")
    .optional()
    .isEmail()
    .withMessage("Invalid email format"),

  body("contactPhone")
    .optional()
    .isLength({ max: 20 })
    .withMessage("Contact phone must be at most 20 characters"),

  body("address")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Address must be at most 500 characters"),

  body("logoUrl")
    .optional()
    .isURL()
    .withMessage("Invalid logo URL"),

  body("gradingSystem")
    .optional()
    .isObject()
    .withMessage("Grading system must be an object"),

  body("attendancePolicy")
    .optional()
    .isObject()
    .withMessage("Attendance policy must be an object"),

  body("termStructure")
    .optional()
    .isObject()
    .withMessage("Term structure must be an object"),

  body("workingDays")
    .optional()
    .isObject()
    .withMessage("Working days must be an object"),

  body("examPolicy")
    .optional()
    .isObject()
    .withMessage("Exam policy must be an object"),
];

module.exports = {
  updateSettingsValidation,
};
