const express = require("express");
const router = express.Router();
const schoolsController = require("./schools.controller");
const {
  createSchoolValidation,
  updateSchoolValidation,
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

router.patch(
  "/:id",
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  updateSchoolValidation,
  validate,
  schoolsController.updateSchool,
);

module.exports = router;
