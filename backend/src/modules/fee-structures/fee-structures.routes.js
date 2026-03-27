const express = require("express");
const router = express.Router();
const feeStructuresController = require("./fee-structures.controller");
const { authenticate, authorize } = require("../../middleware/auth");
const validate = require("../../middleware/validator");
const { createFeeStructureValidation, updateFeeStructureValidation } = require("./fee-structures.validation");
const { ROLES } = require("../../constants");

router.use(authenticate);

// Create a fee component
router.post("/", authorize(ROLES.SCHOOL_ADMIN), createFeeStructureValidation, validate, feeStructuresController.createFeeStructure);

// Get all components (flat list)
router.get("/", authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT), feeStructuresController.getFeeStructures);

// Get grouped view with totals and per-term amounts
router.get("/grouped", authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT), feeStructuresController.getFeeStructuresGrouped);

// Delete all components for a class+year (?classId=1&academicYearId=1)
router.delete("/group", authorize(ROLES.SCHOOL_ADMIN), feeStructuresController.deleteFeeStructureGroup);

// Single component by ID
router.get("/:id", authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT), feeStructuresController.getFeeStructureById);
router.patch("/:id", authorize(ROLES.SCHOOL_ADMIN), updateFeeStructureValidation, validate, feeStructuresController.updateFeeStructure);
router.delete("/:id", authorize(ROLES.SCHOOL_ADMIN), feeStructuresController.deleteFeeStructure);

module.exports = router;
