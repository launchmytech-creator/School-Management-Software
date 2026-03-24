const express = require("express");
const router = express.Router();
const parentDashboardController = require("./parent-dashboard.controller");
const { authenticate, authorize } = require("../../middleware/auth");
const { ROLES } = require("../../constants");

// Dashboard overview
router.get(
  "/dashboard",
  authenticate,
  authorize(ROLES.PARENT),
  parentDashboardController.getDashboard,
);

// Get my children
router.get(
  "/children",
  authenticate,
  authorize(ROLES.PARENT),
  parentDashboardController.getMyChildren,
);

// Get child's marks
router.get(
  "/children/:childId/marks",
  authenticate,
  authorize(ROLES.PARENT),
  parentDashboardController.getChildMarks,
);

// Get child's attendance
router.get(
  "/children/:childId/attendance",
  authenticate,
  authorize(ROLES.PARENT),
  parentDashboardController.getChildAttendance,
);

// Get child's attendance summary
router.get(
  "/children/:childId/attendance-summary",
  authenticate,
  authorize(ROLES.PARENT),
  parentDashboardController.getChildAttendanceSummary,
);

// Get child's fee status
router.get(
  "/children/:childId/fees",
  authenticate,
  authorize(ROLES.PARENT),
  parentDashboardController.getChildFeeStatus,
);

// Get child's syllabus progress
router.get(
  "/children/:childId/syllabus",
  authenticate,
  authorize(ROLES.PARENT),
  parentDashboardController.getChildSyllabusProgress,
);

// Get child's teachers
router.get(
  "/children/:childId/teachers",
  authenticate,
  authorize(ROLES.PARENT),
  parentDashboardController.getChildTeachers,
);

module.exports = router;
