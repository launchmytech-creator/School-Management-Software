const dashboardService = require("./dashboard.service");
const ApiResponse = require("../../utils/response");

class DashboardController {
  async getAdminDashboard(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const data = await dashboardService.getAdminDashboard(schoolId);
      return ApiResponse.success(
        res,
        data,
        "Admin dashboard data retrieved successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async getAccountantDashboard(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const data = await dashboardService.getAccountantDashboard(schoolId);
      return ApiResponse.success(
        res,
        data,
        "Accountant dashboard data retrieved successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async getTeacherDashboard(req, res, next) {
    try {
      const teacherId = req.user.id;
      const schoolId = req.user.schoolId;
      const data = await dashboardService.getTeacherDashboard(
        teacherId,
        schoolId,
      );
      return ApiResponse.success(
        res,
        data,
        "Teacher dashboard data retrieved successfully",
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DashboardController();
