const express = require("express");
const router = express.Router();
const studentsController = require("./students.controller");
const {
  createStudentValidation,
  updateStudentValidation,
} = require("./students.validation");
const validate = require("../../middleware/validator");
const { authenticate, authorize } = require("../../middleware/auth");
const { ROLES } = require("../../constants");

router.post(
  "/",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT),
  createStudentValidation,
  validate,
  studentsController.createStudent,
);

router.get(
  "/",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT, ROLES.TEACHER),
  studentsController.getStudents,
);

router.get(
  "/:id",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT, ROLES.TEACHER, ROLES.PARENT),
  studentsController.getStudentById,
);

router.patch(
  "/:id",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT),
  updateStudentValidation,
  validate,
  studentsController.updateStudent,
);

router.delete(
  "/:id",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN),
  studentsController.deleteStudent,
);

module.exports = router;
