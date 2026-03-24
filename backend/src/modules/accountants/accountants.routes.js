const express = require("express");
const router = express.Router();
const accountantsController = require("./accountants.controller");
const {
  createAccountantValidation,
  updateAccountantValidation,
} = require("./accountants.validation");
const validate = require("../../middleware/validator");
const { authenticate, authorize } = require("../../middleware/auth");
const { ROLES } = require("../../constants");

router.post(
  "/",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN),
  createAccountantValidation,
  validate,
  accountantsController.createAccountant,
);

router.get(
  "/",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN),
  accountantsController.getAccountants,
);

router.get(
  "/:id",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN),
  accountantsController.getAccountantById,
);

router.patch(
  "/:id",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN),
  updateAccountantValidation,
  validate,
  accountantsController.updateAccountant,
);

router.delete(
  "/:id",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN),
  accountantsController.deleteAccountant,
);

module.exports = router;
