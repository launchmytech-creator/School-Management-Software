const express = require("express");
const router = express.Router();
const studentAttendanceController = require("./student-attendance.controller");
const { authenticate, authorize } = require("../../middleware/auth");
const validate = require("../../middleware/validator");
const {
  markAttendanceValidation,
  getClassAttendanceValidation,
} = require("./student-attendance.validation");
const { ROLES } = require("../../constants");

router.use(authenticate);

router.post(
  "/",
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT, ROLES.TEACHER),
  markAttendanceValidation,
  validate,
  studentAttendanceController.markAttendance,
);

router.get(
  "/",
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT, ROLES.TEACHER, ROLES.PARENT),
  studentAttendanceController.getAttendance,
);

router.get(
  "/school-open-days",
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT, ROLES.TEACHER, ROLES.PARENT),
  studentAttendanceController.getSchoolOpenDays,
);

router.get(
  "/student/:studentId/summary",
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT, ROLES.TEACHER, ROLES.PARENT),
  studentAttendanceController.getStudentAttendanceSummary,
);

router.get(
  "/class/:classId",
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT, ROLES.TEACHER),
  getClassAttendanceValidation,
  validate,
  studentAttendanceController.getClassAttendanceByDate,
);

router.delete(
  "/:id",
  authorize(ROLES.SCHOOL_ADMIN),
  studentAttendanceController.deleteAttendance,
);

module.exports = router;
