const express = require("express");
const router = express.Router();
const schoolsController = require("./schools.controller");
const {
  createSchoolValidation,
  updateSchoolValidation,
  updateSchoolAdminValidation,
} = require("./schools.validation");
const validate = require("../../middleware/validator");
const { authenticate, authorize } = require("../../middleware/auth");
const { ROLES } = require("../../constants");

router.post(
  "/",
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  createSchoolValidation,
  validate,
  schoolsController.createSchool,
);

router.get(
  "/",
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  schoolsController.getAllSchools,
);

router.get(
  "/:id",
  authenticate,
  authorize(ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN),
  schoolsController.getSchoolById,
);

// [UPDATED] Allow SCHOOL_ADMIN to update own school (including subscription plan)
router.patch(
  "/:id",
  authenticate,
  authorize(ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN),
  updateSchoolValidation,
  validate,
  schoolsController.updateSchool,
);

// [NEW] Get available subscription plans
router.get(
  "/:id/available-plans",
  authenticate,
  authorize(ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN),
  schoolsController.getAvailablePlans,
);

router.get(
  "/:id/admin",
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  schoolsController.getSchoolAdmin,
);

router.patch(
  "/:id/admin",
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  updateSchoolAdminValidation,
  validate,
  schoolsController.updateSchoolAdmin,
);

module.exports = router;
