const express = require("express");
const router = express.Router();
const subjectsController = require("./subjects.controller");
const {
  createSubjectValidation,
  updateSubjectValidation,
} = require("./subjects.validation");
const validate = require("../../middleware/validator");
const { authenticate, authorize } = require("../../middleware/auth");
const { ROLES } = require("../../constants");

router.post(
  "/",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT),
  createSubjectValidation,
  validate,
  subjectsController.createSubject,
);

router.get(
  "/",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT, ROLES.TEACHER),
  subjectsController.getSubjects,
);

router.get(
  "/:id",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT, ROLES.TEACHER),
  subjectsController.getSubjectById,
);

router.patch(
  "/:id",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT),
  updateSubjectValidation,
  validate,
  subjectsController.updateSubject,
);

router.delete(
  "/:id",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN),
  subjectsController.deleteSubject,
);

module.exports = router;
