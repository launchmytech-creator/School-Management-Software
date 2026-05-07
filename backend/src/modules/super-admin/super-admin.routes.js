const express = require("express");
const router = express.Router();
const superAdminController = require("./super-admin.controller");
const { authenticate, authorize } = require("../../middleware/auth");
const { ROLES } = require("../../constants");

router.get(
  "/stats",
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  superAdminController.getStats
);

router.get(
  "/recent-schools",
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  superAdminController.getRecentSchools
);

router.post(
  "/schools/bulk-deactivate",
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  superAdminController.bulkDeactivate
);

// Plan management routes
router.get(
  "/plans",
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  superAdminController.getAllPlans
);

module.exports = router;
