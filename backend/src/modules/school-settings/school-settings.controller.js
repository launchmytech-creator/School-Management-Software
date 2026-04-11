const schoolSettingsService = require("./school-settings.service");
const ApiResponse = require("../../utils/response");

class SchoolSettingsController {
  async getSettings(req, res, next) {
    try {
      const settings = await schoolSettingsService.getSettings(req.user.schoolId);
      return ApiResponse.success(res, settings);
    } catch (error) {
      next(error);
    }
  }

  async updateSettings(req, res, next) {
    try {
      const settings = await schoolSettingsService.updateSettings(
        req.user.schoolId,
        req.body,
      );
      return ApiResponse.success(res, settings, "Settings updated successfully");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SchoolSettingsController();
