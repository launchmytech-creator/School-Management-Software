const { body, query } = require("express-validator");

const markAttendanceValidation = [
  body("classId")
    .notEmpty()
    .withMessage("Class ID is required")
    .isInt()
    .withMessage("Class ID must be an integer"),

  body("attendanceDate")
    .notEmpty()
    .withMessage("Attendance date is required")
    .isISO8601()
    .withMessage("Invalid date format, use ISO 8601 (YYYY-MM-DD)"),

  body("records")
    .notEmpty()
    .withMessage("Attendance records are required")
    .isArray({ min: 1 })
    .withMessage("Records must be a non-empty array"),

  body("records.*.studentId")
    .notEmpty()
    .withMessage("Student ID is required")
    .isInt()
    .withMessage("Student ID must be an integer"),

  body("records.*.status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["present", "absent", "late"])
    .withMessage("Status must be one of: present, absent, late"),
];

const getClassAttendanceValidation = [
  query("date")
    .notEmpty()
    .withMessage("Date is required")
    .isISO8601()
    .withMessage("Invalid date format, use ISO 8601 (YYYY-MM-DD)"),
];

module.exports = {
  markAttendanceValidation,
  getClassAttendanceValidation,
};
