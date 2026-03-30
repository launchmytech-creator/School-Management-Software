const express = require("express");
const router = express.Router();
const examResultsController = require("./exam-results.controller");
const { authenticate, authorize } = require("../../middleware/auth");
const validate = require("../../middleware/validator");
const { enterMarksValidation } = require("./exam-results.validation");
const { ROLES } = require("../../constants");

router.use(authenticate);

router.post(
  "/",
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT, ROLES.TEACHER),
  enterMarksValidation,
  validate,
  examResultsController.enterMarks,
);

router.get(
  "/",
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT, ROLES.TEACHER),
  examResultsController.getResults,
);

router.get(
  "/student/:studentId",
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT, ROLES.TEACHER, ROLES.PARENT),
  examResultsController.getStudentResults,
);

router.get(
  "/exam-subject/:examSubjectId",
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT, ROLES.TEACHER),
  examResultsController.getExamSubjectResults,
);

router.get(
  "/exam/:examId/performance",
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT),
  examResultsController.getClassPerformance,
);

router.delete(
  "/:id",
  authorize(ROLES.SCHOOL_ADMIN),
  examResultsController.deleteResult,
);

module.exports = router;
