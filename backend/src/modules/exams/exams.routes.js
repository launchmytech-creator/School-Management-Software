const express = require("express");
const router = express.Router();
const examsController = require("./exams.controller");
const { authenticate, authorize } = require("../../middleware/auth");
const validate = require("../../middleware/validator");
const {
  createExamValidation,
  updateExamValidation,
  addExamSubjectValidation,
  updateExamSubjectValidation,
} = require("./exams.validation");
const { ROLES } = require("../../constants");

router.use(authenticate);

router.post(
  "/",
  authorize(ROLES.SCHOOL_ADMIN),
  createExamValidation,
  validate,
  examsController.createExam,
);

router.get(
  "/",
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT, ROLES.TEACHER, ROLES.PARENT),
  examsController.getExams,
);

router.get(
  "/:id",
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT, ROLES.TEACHER),
  examsController.getExamById,
);

router.patch(
  "/:id",
  authorize(ROLES.SCHOOL_ADMIN),
  updateExamValidation,
  validate,
  examsController.updateExam,
);

router.delete(
  "/:id",
  authorize(ROLES.SCHOOL_ADMIN),
  examsController.deleteExam,
);

// Exam subjects routes
router.post(
  "/:examId/subjects",
  authorize(ROLES.SCHOOL_ADMIN),
  addExamSubjectValidation,
  validate,
  examsController.addExamSubject,
);

router.patch(
  "/subjects/:id",
  authorize(ROLES.SCHOOL_ADMIN),
  updateExamSubjectValidation,
  validate,
  examsController.updateExamSubject,
);

router.delete(
  "/subjects/:id",
  authorize(ROLES.SCHOOL_ADMIN),
  examsController.deleteExamSubject,
);

module.exports = router;
