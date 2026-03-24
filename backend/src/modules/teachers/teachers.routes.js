const express = require("express");
const router = express.Router();
const teachersController = require("./teachers.controller");
const { createTeacherValidation } = require("./teachers.validation");
const validate = require("../../middleware/validator");
const { authenticate, authorize } = require("../../middleware/auth");
const { ROLES } = require("../../constants");

router.post(
  "/",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT),
  createTeacherValidation,
  validate,
  teachersController.createTeacher,
);

router.get(
  "/",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT),
  teachersController.getTeachers,
);

router.get(
  "/:id",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT),
  teachersController.getTeacherById,
);

module.exports = router;
