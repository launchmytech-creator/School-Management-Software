const announcementsService = require("./announcements.service");
const ApiResponse = require("../../utils/response");

class AnnouncementsController {
  async createAnnouncement(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const createdBy = req.user.id;
      const announcementData = req.body;

      const result = await announcementsService.createAnnouncement(
        announcementData,
        schoolId,
        createdBy,
      );

      return ApiResponse.created(
        res,
        result,
        "Announcement created successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async getAnnouncements(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const userRole = req.user.role;
      const { targetRole, limit } = req.query;

      const announcements = await announcementsService.getAnnouncements(
        schoolId,
        userRole,
        { targetRole, limit: limit ? parseInt(limit) : null },
      );

      return ApiResponse.success(
        res,
        announcements,
        "Announcements retrieved successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async getAnnouncementById(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const { id } = req.params;

      const announcement = await announcementsService.getAnnouncementById(
        id,
        schoolId,
      );

      return ApiResponse.success(
        res,
        announcement,
        "Announcement retrieved successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async updateAnnouncement(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const { id } = req.params;
      const updateData = req.body;

      const result = await announcementsService.updateAnnouncement(
        id,
        updateData,
        schoolId,
      );

      return ApiResponse.success(
        res,
        result,
        "Announcement updated successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteAnnouncement(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const { id } = req.params;

      await announcementsService.deleteAnnouncement(id, schoolId);

      return ApiResponse.success(
        res,
        null,
        "Announcement deleted successfully",
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AnnouncementsController();
