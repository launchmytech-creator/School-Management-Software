const express = require("express");
const router = express.Router();
const dashboardController = require("./dashboard.controller");
const { authenticate, authorize } = require("../../middleware/auth");
const { ROLES } = require("../../constants");

// Admin dashboard — single endpoint replacing 7+ frontend calls
router.get(
  "/admin",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN),
  dashboardController.getAdminDashboard,
);

// Accountant dashboard — single endpoint replacing 3 calls + client-side filtering
router.get(
  "/accountant",
  authenticate,
  authorize(ROLES.ACCOUNTANT),
  dashboardController.getAccountantDashboard,
);

// Teacher dashboard — single endpoint replacing 1 + N calls
router.get(
  "/teacher",
  authenticate,
  authorize(ROLES.TEACHER),
  dashboardController.getTeacherDashboard,
);

module.exports = router;
