const express = require("express");
const router = express.Router();
const chaptersController = require("./chapters.controller");
const {
  createChapterValidation,
  updateChapterValidation,
} = require("./chapters.validation");
const validate = require("../../middleware/validator");
const { authenticate, authorize } = require("../../middleware/auth");
const { ROLES } = require("../../constants");

router.post(
  "/",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT, ROLES.TEACHER),
  createChapterValidation,
  validate,
  chaptersController.createChapter,
);

router.get(
  "/subject/:subjectId",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT, ROLES.TEACHER),
  chaptersController.getChaptersBySubject,
);

router.get(
  "/:id",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT, ROLES.TEACHER),
  chaptersController.getChapterById,
);

router.patch(
  "/:id",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT, ROLES.TEACHER),
  updateChapterValidation,
  validate,
  chaptersController.updateChapter,
);

router.delete(
  "/:id",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN),
  chaptersController.deleteChapter,
);

module.exports = router;
