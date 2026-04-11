const express = require("express");
const router = express.Router();
const timetablesController = require("./timetables.controller");
const { authenticate, authorize } = require("../../middleware/auth");
const validate = require("../../middleware/validator");
const {
  createTimetableValidation,
  updateTimetableValidation,
  getTimetableValidation,
} = require("./timetables.validation");
const { ROLES } = require("../../constants");

router.use(authenticate);

router.post(
  "/",
  authorize(ROLES.SCHOOL_ADMIN, ROLES.TEACHER),
  createTimetableValidation,
  validate,
  timetablesController.createTimetable,
);

router.post(
  "/bulk",
  authorize(ROLES.SCHOOL_ADMIN),
  timetablesController.bulkCreateTimetable,
);

router.get(
  "/",
  authorize(ROLES.SCHOOL_ADMIN, ROLES.TEACHER, ROLES.ACCOUNTANT),
  getTimetableValidation,
  validate,
  timetablesController.getTimetables,
);

router.get(
  "/:id",
  authorize(ROLES.SCHOOL_ADMIN, ROLES.TEACHER),
  timetablesController.getTimetableById,
);

router.patch(
  "/:id",
  authorize(ROLES.SCHOOL_ADMIN, ROLES.TEACHER),
  updateTimetableValidation,
  validate,
  timetablesController.updateTimetable,
);

router.delete(
  "/:id",
  authorize(ROLES.SCHOOL_ADMIN),
  timetablesController.deleteTimetable,
);

module.exports = router;
