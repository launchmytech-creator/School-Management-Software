const express = require("express");
const router = express.Router();
const academicYearsController = require("./academic-years.controller");
const {
  createAcademicYearValidation,
  updateAcademicYearValidation,
} = require("./academic-years.validation");
const validate = require("../../middleware/validator");
const { authenticate, authorize } = require("../../middleware/auth");
const { ROLES } = require("../../constants");

router.post(
  "/",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN),
  createAcademicYearValidation,
  validate,
  academicYearsController.createAcademicYear,
);

router.get(
  "/",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT, ROLES.TEACHER),
  academicYearsController.getAcademicYears,
);

router.get(
  "/current",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT, ROLES.TEACHER),
  academicYearsController.getCurrentAcademicYear,
);

router.get(
  "/:id",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT, ROLES.TEACHER),
  academicYearsController.getAcademicYearById,
);

router.patch(
  "/:id",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN),
  updateAcademicYearValidation,
  validate,
  academicYearsController.updateAcademicYear,
);

router.patch(
  "/:id/set-current",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN),
  academicYearsController.setCurrentAcademicYear,
);

router.delete(
  "/:id",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN),
  academicYearsController.deleteAcademicYear,
);

module.exports = router;
