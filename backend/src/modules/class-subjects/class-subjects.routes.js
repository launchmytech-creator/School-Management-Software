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

// Get all class-subject assignments. [UPDATED] Added ACCOUNTANT, TEACHER roles
router.get(
  "/",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT, ROLES.TEACHER),
  classSubjectsController.getAllClassSubjects,
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
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT),
  classSubjectsController.removeSubjectFromClass,
);

// Assign a subject to multiple classes at once. [NEW] Roles: SCHOOL_ADMIN, ACCOUNTANT
router.post(
  "/assign-multiple",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT),
  classSubjectsController.assignSubjectToMultipleClasses,
);

// Check existing class-subject assignments. [NEW] Query: ?classIds=1,2&academicYearId=1
router.get(
  "/check-existing",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT),
  classSubjectsController.checkExistingAssignments,
);

module.exports = router;
