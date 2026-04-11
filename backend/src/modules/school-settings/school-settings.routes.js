const express = require("express");
const router = express.Router();
const schoolSettingsController = require("./school-settings.controller");
const { authenticate, authorize } = require("../../middleware/auth");
const validate = require("../../middleware/validator");
const { updateSettingsValidation } = require("./school-settings.validation");
const { ROLES } = require("../../constants");

router.use(authenticate);

router.get(
  "/",
  authorize(ROLES.SCHOOL_ADMIN),
  schoolSettingsController.getSettings,
);

router.patch(
  "/",
  authorize(ROLES.SCHOOL_ADMIN),
  updateSettingsValidation,
  validate,
  schoolSettingsController.updateSettings,
);

module.exports = router;
