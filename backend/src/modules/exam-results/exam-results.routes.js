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

router.get(
  "/comparison",
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT),
  examResultsController.getClassComparison,
);

router.get(
  "/comparison/classes",
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT),
  examResultsController.getClassesForComparison,
);

router.get(
  "/comparison/subjects",
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT),
  examResultsController.getClassSubjectComparison,
);

router.delete(
  "/:id",
  authorize(ROLES.SCHOOL_ADMIN),
  examResultsController.deleteResult,
);

router.get(
  "/class/:classId/subjects",
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT, ROLES.TEACHER),
  examResultsController.getClassSubjects,
);

router.get(
  "/class/:classId/subject/:subjectId/exams",
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT, ROLES.TEACHER),
  examResultsController.getExamsForSubject,
);

router.get(
  "/class/:classId/subject/:subjectId/exam/:examId",
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT, ROLES.TEACHER),
  examResultsController.getExamResults,
);

router.get(
  "/class/:classId/results",
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT, ROLES.TEACHER),
  examResultsController.getClassResults,
);

module.exports = router;
