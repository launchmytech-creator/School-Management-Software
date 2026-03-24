const express = require("express");
const router = express.Router();
const teacherAllocationsController = require("./teacher-allocations.controller");
const {
  allocateTeacherValidation,
} = require("./teacher-allocations.validation");
const validate = require("../../middleware/validator");
const { authenticate, authorize } = require("../../middleware/auth");
const { ROLES } = require("../../constants");

router.post(
  "/",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN),
  allocateTeacherValidation,
  validate,
  teacherAllocationsController.allocateTeacher,
);

router.get(
  "/",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT),
  teacherAllocationsController.getAllAllocations,
);

router.get(
  "/teacher/:teacherId",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT, ROLES.TEACHER),
  teacherAllocationsController.getAllocationsByTeacher,
);

router.get(
  "/class/:classId",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT, ROLES.TEACHER),
  teacherAllocationsController.getAllocationsByClass,
);

router.get(
  "/:id",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT),
  teacherAllocationsController.getAllocationById,
);

router.delete(
  "/:id",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN),
  teacherAllocationsController.removeAllocation,
);

module.exports = router;
