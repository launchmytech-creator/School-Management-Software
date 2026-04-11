const superAdminService = require("./super-admin.service");
const ApiResponse = require("../../utils/response");

class SuperAdminController {
  async getStats(req, res, next) {
    try {
      const stats = await superAdminService.getStats();
      return ApiResponse.success(res, stats, "Stats retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  async getRecentSchools(req, res, next) {
    try {
      const schools = await superAdminService.getRecentSchools();
      return ApiResponse.success(res, schools, "Recent schools retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  async bulkDeactivate(req, res, next) {
    try {
      const { ids } = req.body;
      await superAdminService.bulkDeactivate(ids);
      return ApiResponse.success(res, null, "Schools deactivated successfully");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SuperAdminController();
