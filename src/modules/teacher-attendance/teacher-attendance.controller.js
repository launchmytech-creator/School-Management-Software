const teacherAttendanceService = require("./teacher-attendance.service");
const ApiResponse = require("../../utils/response");

class TeacherAttendanceController {
  async markAttendance(req, res, next) {
    try {
      const records = await teacherAttendanceService.markAttendance(
        req.body,
        req.user.schoolId,
      );
      return ApiResponse.success(
        res,
        records,
        `Attendance marked for ${records.length} teachers`,
      );
    } catch (error) {
      next(error);
    }
  }

  async getAttendance(req, res, next) {
    try {
      const attendance = await teacherAttendanceService.getAttendanceBySchool(
        req.user.schoolId,
        req.query,
      );
      return ApiResponse.success(res, attendance);
    } catch (error) {
      next(error);
    }
  }

  async getTeacherAttendanceSummary(req, res, next) {
    try {
      const summary =
        await teacherAttendanceService.getTeacherAttendanceSummary(
          req.params.teacherId,
          req.user.schoolId,
          req.query,
        );
      return ApiResponse.success(res, summary);
    } catch (error) {
      next(error);
    }
  }

  async getAttendanceByDate(req, res, next) {
    try {
      const attendance = await teacherAttendanceService.getAttendanceByDate(
        req.query.date,
        req.user.schoolId,
      );
      return ApiResponse.success(res, attendance);
    } catch (error) {
      next(error);
    }
  }

  async deleteAttendance(req, res, next) {
    try {
      await teacherAttendanceService.deleteAttendance(
        req.params.id,
        req.user.schoolId,
      );
      return ApiResponse.success(
        res,
        null,
        "Attendance record deleted successfully",
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TeacherAttendanceController();
