const express = require("express");
const router = express.Router();
const notificationsController = require("./notifications.controller");
const validate = require("../../middleware/validator");
const { authenticate, authorize } = require("../../middleware/auth");
const {
  sendNotificationValidation,
  feeReminderValidation,
  examResultValidation,
  attendanceAlertValidation,
  broadcastValidation,
} = require("./notifications.validation");
const { ROLES } = require("../../constants");

// All routes require authentication
router.use(authenticate);

// ── User routes ──────────────────────────────────────────────────────────────
// Any authenticated user can view their own notifications
router.get("/my", notificationsController.getMyNotifications);

// ── Admin / school_admin routes ──────────────────────────────────────────────
router.get(
  "/",
  authorize(ROLES.SCHOOL_ADMIN, ROLES.SUPER_ADMIN),
  notificationsController.getSchoolNotifications,
);

router.post(
  "/send",
  authorize(ROLES.SCHOOL_ADMIN, ROLES.SUPER_ADMIN),
  sendNotificationValidation,
  validate,
  notificationsController.sendNotification,
);

router.post(
  "/broadcast",
  authorize(ROLES.SCHOOL_ADMIN, ROLES.SUPER_ADMIN),
  broadcastValidation,
  validate,
  notificationsController.broadcastAnnouncement,
);

router.post(
  "/retry-failed",
  authorize(ROLES.SCHOOL_ADMIN, ROLES.SUPER_ADMIN),
  notificationsController.retryFailed,
);

// ── Accountant routes ────────────────────────────────────────────────────────
router.post(
  "/fee-reminder",
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT),
  feeReminderValidation,
  validate,
  notificationsController.sendFeeReminder,
);

// ── Teacher / admin routes ───────────────────────────────────────────────────
router.post(
  "/exam-result",
  authorize(ROLES.SCHOOL_ADMIN, ROLES.TEACHER),
  examResultValidation,
  validate,
  notificationsController.sendExamResult,
);

router.post(
  "/attendance-alert",
  authorize(ROLES.SCHOOL_ADMIN, ROLES.TEACHER),
  attendanceAlertValidation,
  validate,
  notificationsController.sendAttendanceAlert,
);

module.exports = router;
