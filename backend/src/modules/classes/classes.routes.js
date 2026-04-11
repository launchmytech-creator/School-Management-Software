const express = require("express");
const router = express.Router();
const classesController = require("./classes.controller");
const {
  createClassValidation,
  updateClassValidation,
} = require("./classes.validation");
const validate = require("../../middleware/validator");
const { authenticate, authorize } = require("../../middleware/auth");
const { ROLES } = require("../../constants");

router.post(
  "/",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN),
  createClassValidation,
  validate,
  classesController.createClass,
);

router.get(
  "/",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT, ROLES.TEACHER),
  classesController.getClasses,
);

router.get(
  "/incharge/:teacherId",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT, ROLES.TEACHER),
  classesController.getClassesByIncharge,
);

router.get(
  "/:id",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT, ROLES.TEACHER),
  classesController.getClassById,
);

router.patch(
  "/:id",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN),
  updateClassValidation,
  validate,
  classesController.updateClass,
);

router.delete(
  "/:id",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN),
  classesController.deleteClass,
);

module.exports = router;
