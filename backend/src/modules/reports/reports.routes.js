const express = require("express");
const router = express.Router();
const reportsController = require("./reports.controller");
const { authenticate, authorize } = require("../../middleware/auth");
const validate = require("../../middleware/validator");
const { getReportValidation } = require("./reports.validation");
const { ROLES } = require("../../constants");

router.use(authenticate);

router.get(
  "/",
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT),
  getReportValidation,
  validate,
  reportsController.getReport,
);

module.exports = router;
