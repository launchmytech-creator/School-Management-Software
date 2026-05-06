const express = require("express");
const router = express.Router();
const authController = require("./auth.controller");
const {
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
} = require("./auth.validation");
const validate = require("../../middleware/validator");
const { authenticate } = require("../../middleware/auth");

router.post("/login", loginValidation, validate, authController.login);
router.get("/profile", authenticate, authController.getProfile);
// [NEW] Update own profile
router.patch("/profile", authenticate, authController.updateProfile);
// [NEW] Forgot password
router.post(
  "/forgot-password",
  forgotPasswordValidation,
  validate,
  authController.forgotPassword,
);
// [NEW] Reset password
router.post(
  "/reset-password",
  resetPasswordValidation,
  validate,
  authController.resetPassword,
);

module.exports = router;
