const express = require("express");
const router = express.Router();
const classSubjectsController = require("./class-subjects.controller");
const {
  assignSubjectValidation,
  updateClassSubjectValidation,
} = require("./class-subjects.validation");
const validate = require("../../middleware/validator");
const { authenticate, authorize } = require("../../middleware/auth");
const { ROLES } = require("../../constants");

router.post(
  "/",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN),
  assignSubjectValidation,
  validate,
  classSubjectsController.assignSubjectToClass,
);

router.get(
  "/class/:classId",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT, ROLES.TEACHER, ROLES.PARENT),
  classSubjectsController.getSubjectsByClass,
);

router.get(
  "/subject/:subjectId",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT, ROLES.TEACHER),
  classSubjectsController.getClassesBySubject,
);

router.get(
  "/:id",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT, ROLES.TEACHER),
  classSubjectsController.getClassSubjectById,
);

router.patch(
  "/:id",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN),
  updateClassSubjectValidation,
  validate,
  classSubjectsController.updateClassSubject,
);

router.delete(
  "/:id",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN),
  classSubjectsController.removeSubjectFromClass,
);

module.exports = router;
