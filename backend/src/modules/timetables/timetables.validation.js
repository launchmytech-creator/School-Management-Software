const { body, query } = require("express-validator");

const createTimetableValidation = [
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

  body("dayOfWeek")
    .notEmpty()
    .withMessage("Day of week is required")
    .isInt({ min: 0, max: 6 })
    .withMessage("Day of week must be between 0 (Sunday) and 6 (Saturday)"),

  body("periodNumber")
    .notEmpty()
    .withMessage("Period number is required")
    .isInt({ min: 1 })
    .withMessage("Period number must be at least 1"),

  body("subjectId")
    .optional()
    .isInt()
    .withMessage("Subject ID must be an integer"),

  body("teacherId")
    .optional()
    .isInt()
    .withMessage("Teacher ID must be an integer"),

  body("startTime")
    .notEmpty()
    .withMessage("Start time is required")
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Invalid start time format (HH:MM)"),

  body("endTime")
    .notEmpty()
    .withMessage("End time is required")
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Invalid end time format (HH:MM)"),

  body("room")
    .optional()
    .isLength({ max: 50 })
    .withMessage("Room must be at most 50 characters"),
];

const updateTimetableValidation = [
  body("subjectId")
    .optional()
    .isInt()
    .withMessage("Subject ID must be an integer"),

  body("teacherId")
    .optional()
    .isInt()
    .withMessage("Teacher ID must be an integer"),

  body("startTime")
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Invalid start time format (HH:MM)"),

  body("endTime")
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Invalid end time format (HH:MM)"),

  body("room")
    .optional()
    .isLength({ max: 50 })
    .withMessage("Room must be at most 50 characters"),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
];

const getTimetableValidation = [
  query("classId")
    .optional()
    .isInt()
    .withMessage("Class ID must be an integer"),

  query("academicYearId")
    .optional()
    .isInt()
    .withMessage("Academic year ID must be an integer"),

  query("dayOfWeek")
    .optional()
    .isInt({ min: 0, max: 6 })
    .withMessage("Day of week must be between 0 and 6"),

  query("teacherId")
    .optional()
    .isInt()
    .withMessage("Teacher ID must be an integer"),
];

module.exports = {
  createTimetableValidation,
  updateTimetableValidation,
  getTimetableValidation,
};
