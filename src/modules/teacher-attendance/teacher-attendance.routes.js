const express = require("express");
const router = express.Router();
const teacherAttendanceController = require("./teacher-attendance.controller");
const { authenticate, authorize } = require("../../middleware/auth");
const validate = require("../../middleware/validator");
const {
  markAttendanceValidation,
  getAttendanceByDateValidation,
} = require("./teacher-attendance.validation");
const { ROLES } = require("../../constants");

router.use(authenticate);

router.post(
  "/",
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT),
  markAttendanceValidation,
  validate,
  teacherAttendanceController.markAttendance,
);

router.get(
  "/",
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT),
  teacherAttendanceController.getAttendance,
);

router.get(
  "/teacher/:teacherId/summary",
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT),
  teacherAttendanceController.getTeacherAttendanceSummary,
);

router.get(
  "/date",
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT),
  getAttendanceByDateValidation,
  validate,
  teacherAttendanceController.getAttendanceByDate,
);

router.delete(
  "/:id",
  authorize(ROLES.SCHOOL_ADMIN),
  teacherAttendanceController.deleteAttendance,
);

module.exports = router;
