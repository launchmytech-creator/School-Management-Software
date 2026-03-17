const express = require("express");
const router = express.Router();
const syllabusCompletionController = require("./syllabus-completion.controller");
const { authenticate, authorize } = require("../../middleware/auth");
const validate = require("../../middleware/validator");
const {
  markCompletionValidation,
} = require("./syllabus-completion.validation");
const { ROLES } = require("../../constants");

router.use(authenticate);

router.post(
  "/",
  authorize(ROLES.SCHOOL_ADMIN, ROLES.TEACHER),
  markCompletionValidation,
  validate,
  syllabusCompletionController.markCompletion,
);

router.get(
  "/",
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT, ROLES.TEACHER),
  syllabusCompletionController.getCompletion,
);

router.get(
  "/class-subject/:classSubjectId/progress",
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT, ROLES.TEACHER),
  syllabusCompletionController.getClassSubjectProgress,
);

router.get(
  "/class-subject/:classSubjectId/chapters",
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT, ROLES.TEACHER),
  syllabusCompletionController.getSubjectChapters,
);

router.delete(
  "/:id",
  authorize(ROLES.SCHOOL_ADMIN),
  syllabusCompletionController.deleteCompletion,
);

module.exports = router;
