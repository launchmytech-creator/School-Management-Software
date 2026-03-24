const express = require("express");
const router = express.Router();
const announcementsController = require("./announcements.controller");
const {
  createAnnouncementValidation,
  updateAnnouncementValidation,
} = require("./announcements.validation");
const validate = require("../../middleware/validator");
const { authenticate, authorize } = require("../../middleware/auth");
const { ROLES } = require("../../constants");

// Create announcement (Admin only)
router.post(
  "/",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN),
  createAnnouncementValidation,
  validate,
  announcementsController.createAnnouncement,
);

// Get announcements (All authenticated users)
router.get("/", authenticate, announcementsController.getAnnouncements);

// Get announcement by ID (All authenticated users)
router.get("/:id", authenticate, announcementsController.getAnnouncementById);

// Update announcement (Admin only)
router.patch(
  "/:id",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN),
  updateAnnouncementValidation,
  validate,
  announcementsController.updateAnnouncement,
);

// Delete announcement (Admin only)
router.delete(
  "/:id",
  authenticate,
  authorize(ROLES.SCHOOL_ADMIN),
  announcementsController.deleteAnnouncement,
);

module.exports = router;
