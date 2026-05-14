const parentDashboardService = require("./parent-dashboard.service");
const ApiResponse = require("../../utils/response");

class ParentDashboardController {
  async getDashboard(req, res, next) {
    try {
      const parentId = req.user.id;
      const schoolId = req.user.schoolId;
      console.log(parentId);
      const overview = await parentDashboardService.getDashboardOverview(
        parentId,
        schoolId,
      );
      console.log(overview);
      return ApiResponse.success(
        res,
        overview,
        "Dashboard overview retrieved successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async getMyChildren(req, res, next) {
    try {
      const parentId = req.user.id;
      const schoolId = req.user.schoolId;
      console.log(parentId);
      const children = await parentDashboardService.getMyChildren(
        parentId,
        schoolId,
      );
      console.log(children);
      return ApiResponse.success(
        res,
        children,
        "Children retrieved successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async getChildMarks(req, res, next) {
    try {
      const parentId = req.user.id;
      const schoolId = req.user.schoolId;
      const { childId } = req.params;

      const marks = await parentDashboardService.getChildMarks(
        childId,
        parentId,
        schoolId,
      );

      return ApiResponse.success(
        res,
        marks,
        "Child marks retrieved successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async getChildAttendance(req, res, next) {
    try {
      const parentId = req.user.id;
      const schoolId = req.user.schoolId;
      const { childId } = req.params;
      const { startDate, endDate } = req.query;

      const attendance = await parentDashboardService.getChildAttendance(
        childId,
        parentId,
        schoolId,
        { startDate, endDate },
      );

      return ApiResponse.success(
        res,
        attendance,
        "Child attendance retrieved successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async getChildAttendanceSummary(req, res, next) {
    try {
      const parentId = req.user.id;
      const schoolId = req.user.schoolId;
      const { childId } = req.params;
      const { academicYearId } = req.query;

      const summary = await parentDashboardService.getChildAttendanceSummary(
        childId,
        parentId,
        schoolId,
        academicYearId,
      );

      return ApiResponse.success(
        res,
        summary,
        "Attendance summary retrieved successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async getChildFeeStatus(req, res, next) {
    try {
      const parentId = req.user.id;
      const schoolId = req.user.schoolId;
      const { childId } = req.params;

      const feeStatus = await parentDashboardService.getChildFeeStatus(
        childId,
        parentId,
        schoolId,
      );

      return ApiResponse.success(
        res,
        feeStatus,
        "Child fee status retrieved successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async getChildSyllabusProgress(req, res, next) {
    try {
      const parentId = req.user.id;
      const schoolId = req.user.schoolId;
      const { childId } = req.params;

      const progress = await parentDashboardService.getChildSyllabusProgress(
        childId,
        parentId,
        schoolId,
      );

      return ApiResponse.success(
        res,
        progress,
        "Syllabus progress retrieved successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async getChildTeachers(req, res, next) {
    try {
      const parentId = req.user.id;
      const schoolId = req.user.schoolId;
      const { childId } = req.params;

      const teachers = await parentDashboardService.getChildTeachers(
        childId,
        parentId,
        schoolId,
      );

      return ApiResponse.success(
        res,
        teachers,
        "Child teachers retrieved successfully",
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ParentDashboardController();
