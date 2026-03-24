const express = require("express");
const router = express.Router();
const studentPromotionsController = require("./student-promotions.controller");
const { authenticate, authorize } = require("../../middleware/auth");
const validate = require("../../middleware/validator");
const {
  promoteStudentsValidation,
} = require("./student-promotions.validation");
const { ROLES } = require("../../constants");

router.use(authenticate);

router.post(
  "/",
  authorize(ROLES.SCHOOL_ADMIN),
  promoteStudentsValidation,
  validate,
  studentPromotionsController.promoteStudents,
);

router.get(
  "/",
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT),
  studentPromotionsController.getPromotions,
);

router.get(
  "/student/:studentId/history",
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT),
  studentPromotionsController.getStudentPromotionHistory,
);

router.get(
  "/class/:classId/eligible-students",
  authorize(ROLES.SCHOOL_ADMIN),
  studentPromotionsController.getEligibleStudents,
);

router.get(
  "/:id",
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT),
  studentPromotionsController.getPromotionById,
);

router.delete(
  "/:id",
  authorize(ROLES.SCHOOL_ADMIN),
  studentPromotionsController.deletePromotion,
);

module.exports = router;
