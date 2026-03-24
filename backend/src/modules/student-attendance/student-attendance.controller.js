const studentAttendanceService = require("./student-attendance.service");
const ApiResponse = require("../../utils/response");

class StudentAttendanceController {
  async markAttendance(req, res, next) {
    try {
      const records = await studentAttendanceService.markAttendance(
        req.body,
        req.user.schoolId,
        req.user.id,
      );
      return ApiResponse.success(
        res,
        records,
        `Attendance marked for ${records.length} students`,
      );
    } catch (error) {
      next(error);
    }
  }

  async getAttendance(req, res, next) {
    try {
      const attendance = await studentAttendanceService.getAttendanceBySchool(
        req.user.schoolId,
        req.query,
        { callerId: req.user.id, callerRole: req.user.role },
      );
      return ApiResponse.success(res, attendance);
    } catch (error) {
      next(error);
    }
  }

  async getStudentAttendanceSummary(req, res, next) {
    try {
      const summary =
        await studentAttendanceService.getStudentAttendanceSummary(
          req.params.studentId,
          req.user.schoolId,
          req.query,
        );
      return ApiResponse.success(res, summary);
    } catch (error) {
      next(error);
    }
  }

  async getClassAttendanceByDate(req, res, next) {
    try {
      const attendance =
        await studentAttendanceService.getClassAttendanceByDate(
          req.params.classId,
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
      await studentAttendanceService.deleteAttendance(
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

module.exports = new StudentAttendanceController();
