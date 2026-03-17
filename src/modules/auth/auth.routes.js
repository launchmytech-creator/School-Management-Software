const express = require("express");
const router = express.Router();
const authController = require("./auth.controller");
const { loginValidation } = require("./auth.validation");
const validate = require("../../middleware/validator");
const { authenticate } = require("../../middleware/auth");

router.post("/login", loginValidation, validate, authController.login);
router.get("/profile", authenticate, authController.getProfile);

module.exports = router;
