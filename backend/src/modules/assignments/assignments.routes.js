const express = require("express");
const router = express.Router();
const assignmentsController = require("./assignments.controller");
const { authenticate, authorize } = require("../../middleware/auth");
const validate = require("../../middleware/validator");
const {
  createAssignmentValidation,
  updateAssignmentValidation,
  gradeSubmissionValidation,
} = require("./assignments.validation");
const { ROLES } = require("../../constants");

router.use(authenticate);

router.post(
  "/",
  authorize(ROLES.SCHOOL_ADMIN, ROLES.TEACHER),
  createAssignmentValidation,
  validate,
  assignmentsController.createAssignment,
);

router.get(
  "/",
  authorize(ROLES.SCHOOL_ADMIN, ROLES.TEACHER, ROLES.STUDENT),
  assignmentsController.getAssignments,
);

router.get(
  "/:id",
  authorize(ROLES.SCHOOL_ADMIN, ROLES.TEACHER, ROLES.STUDENT),
  assignmentsController.getAssignmentById,
);

router.get(
  "/:id/submissions",
  authorize(ROLES.SCHOOL_ADMIN, ROLES.TEACHER),
  assignmentsController.getSubmissions,
);

router.patch(
  "/:id",
  authorize(ROLES.SCHOOL_ADMIN, ROLES.TEACHER),
  updateAssignmentValidation,
  validate,
  assignmentsController.updateAssignment,
);

router.delete(
  "/:id",
  authorize(ROLES.SCHOOL_ADMIN, ROLES.TEACHER),
  assignmentsController.deleteAssignment,
);

router.post(
  "/:id/submit",
  authorize(ROLES.STUDENT),
  assignmentsController.submitAssignment,
);

router.post(
  "/submissions/:submissionId/grade",
  authorize(ROLES.SCHOOL_ADMIN, ROLES.TEACHER),
  gradeSubmissionValidation,
  validate,
  assignmentsController.gradeSubmission,
);

module.exports = router;
