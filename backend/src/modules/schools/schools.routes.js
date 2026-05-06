const express = require("express");
const router = express.Router();
const schoolsController = require("./schools.controller");
const {
  createSchoolValidation,
  updateSchoolValidation,
  updateSchoolAdminValidation,
  purchaseSubscriptionValidation,
  updatePricingValidation,
} = require("./schools.validation");
const validate = require("../../middleware/validator");
const { authenticate, authorize } = require("../../middleware/auth");
const { ROLES } = require("../../constants");

router.post(
  "/",
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  createSchoolValidation,
  validate,
  schoolsController.createSchool,
);

router.get(
  "/",
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  schoolsController.getAllSchools,
);

// [NEW] Get available plans with pricing
router.get(
  "/available-plans",
  authenticate,
  authorize(ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN),
  schoolsController.getAvailablePlansWithPricing,
);

router.get(
  "/:id",
  authenticate,
  authorize(ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN),
  schoolsController.getSchoolById,
);

// [UPDATED] Allow SCHOOL_ADMIN to update own school (including subscription plan)
router.patch(
  "/:id",
  authenticate,
  authorize(ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN),
  updateSchoolValidation,
  validate,
  schoolsController.updateSchool,
);

router.get(
  "/:id/admin",
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  schoolsController.getSchoolAdmin,
);

router.patch(
  "/:id/admin",
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  updateSchoolAdminValidation,
  validate,
  schoolsController.updateSchoolAdmin,
);

// [NEW] Purchase subscription
router.post(
  "/:id/purchase-subscription",
  authenticate,
  authorize(ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN),
  purchaseSubscriptionValidation,
  validate,
  schoolsController.purchaseSubscription,
);

// [NEW] Calculate upgrade pricing (preview)
router.post(
  "/:id/calculate-upgrade",
  authenticate,
  authorize(ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN),
  schoolsController.calculateUpgrade,
);

// [NEW] Get subscription payment history
router.get(
  "/:id/subscription-history",
  authenticate,
  authorize(ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN),
  schoolsController.getSubscriptionHistory,
);

// [NEW] Update plan pricing (super admin only)
router.patch(
  "/plans/:planId/pricing",
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  updatePricingValidation,
  validate,
  schoolsController.updatePlanPricing,
);

module.exports = router;
