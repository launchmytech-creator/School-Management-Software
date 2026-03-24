const express = require("express");
const router = express.Router();
const feeStructuresController = require("./fee-structures.controller");
const { authenticate, authorize } = require("../../middleware/auth");
const validate = require("../../middleware/validator");
const {
  createFeeStructureValidation,
  updateFeeStructureValidation,
} = require("./fee-structures.validation");
const { ROLES } = require("../../constants");

router.use(authenticate);

router.post(
  "/",
  authorize(ROLES.SCHOOL_ADMIN),
  createFeeStructureValidation,
  validate,
  feeStructuresController.createFeeStructure,
);

router.get(
  "/",
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT),
  feeStructuresController.getFeeStructures,
);

router.get(
  "/:id",
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT),
  feeStructuresController.getFeeStructureById,
);

router.patch(
  "/:id",
  authorize(ROLES.SCHOOL_ADMIN),
  updateFeeStructureValidation,
  validate,
  feeStructuresController.updateFeeStructure,
);

router.delete(
  "/:id",
  authorize(ROLES.SCHOOL_ADMIN),
  feeStructuresController.deleteFeeStructure,
);

module.exports = router;
