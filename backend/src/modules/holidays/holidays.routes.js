const express = require("express");
const router = express.Router();
const holidaysController = require("./holidays.controller");
const { authenticate, authorize } = require("../../middleware/auth");
const validate = require("../../middleware/validator");
const {
  createHolidayValidation,
  updateHolidayValidation,
  getWorkingDaysValidation,
} = require("./holidays.validation");
const { ROLES } = require("../../constants");

router.use(authenticate);

router.post(
  "/",
  authorize(ROLES.SCHOOL_ADMIN),
  createHolidayValidation,
  validate,
  holidaysController.createHoliday,
);

router.get(
  "/",
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT, ROLES.TEACHER),
  holidaysController.getHolidays,
);

router.get(
  "/working-days",
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT),
  getWorkingDaysValidation,
  validate,
  holidaysController.getWorkingDaysCount,
);

router.get(
  "/:id",
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT, ROLES.TEACHER),
  holidaysController.getHolidayById,
);

router.patch(
  "/:id",
  authorize(ROLES.SCHOOL_ADMIN),
  updateHolidayValidation,
  validate,
  holidaysController.updateHoliday,
);

router.delete(
  "/:id",
  authorize(ROLES.SCHOOL_ADMIN),
  holidaysController.deleteHoliday,
);

module.exports = router;
