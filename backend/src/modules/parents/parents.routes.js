const express = require("express");
const router = express.Router();
const parentsController = require("./parents.controller");
const {
  createParentValidation,
  updateParentValidation,
  linkStudentValidation,
} = require("./parents.validation");
const validate = require("../../middleware/validator");
const { authenticate, authorize } = require("../../middleware/auth");
const { ROLES } = require("../../constants");

// Create parent (Admin only)
router.post(
  "/",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN),
  createParentValidation,
  validate,
  parentsController.createParent,
);

// Get all parents (Admin, Accountant)
router.get(
  "/",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT),
  parentsController.getParents,
);

// Get parent by ID (Admin, Accountant)
router.get(
  "/:id",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT),
  parentsController.getParentById,
);

// Update parent (Admin only)
router.patch(
  "/:id",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN),
  updateParentValidation,
  validate,
  parentsController.updateParent,
);

// Delete parent (Admin only)
router.delete(
  "/:id",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN),
  parentsController.deleteParent,
);

// Link student to parent (Admin only)
router.post(
  "/:id/link-student",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN),
  linkStudentValidation,
  validate,
  parentsController.linkStudent,
);

// Unlink student from parent (Admin only)
router.delete(
  "/students/:studentId/unlink",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN),
  parentsController.unlinkStudent,
);

// Get parent's children (Admin, Accountant, or the Parent themselves)
router.get(
  "/:id/children",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT, ROLES.PARENT),
  parentsController.getChildren,
);

module.exports = router;
