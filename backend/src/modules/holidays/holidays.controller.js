const holidaysService = require("./holidays.service");
const ApiResponse = require("../../utils/response");

class HolidaysController {
  async createHoliday(req, res, next) {
    try {
      const holiday = await holidaysService.createHoliday(
        req.body,
        req.user.schoolId,
      );
      return ApiResponse.created(res, holiday, "Holiday created successfully");
    } catch (error) {
      next(error);
    }
  }

  async getHolidays(req, res, next) {
    try {
      const holidays = await holidaysService.getHolidaysBySchool(
        req.user.schoolId,
        req.query,
      );
      return ApiResponse.success(res, holidays);
    } catch (error) {
      next(error);
    }
  }

  async getHolidayById(req, res, next) {
    try {
      const holiday = await holidaysService.getHolidayById(
        req.params.id,
        req.user.schoolId,
      );
      return ApiResponse.success(res, holiday);
    } catch (error) {
      next(error);
    }
  }

  async updateHoliday(req, res, next) {
    try {
      const holiday = await holidaysService.updateHoliday(
        req.params.id,
        req.body,
        req.user.schoolId,
      );
      return ApiResponse.success(res, holiday, "Holiday updated successfully");
    } catch (error) {
      next(error);
    }
  }

  async deleteHoliday(req, res, next) {
    try {
      await holidaysService.deleteHoliday(req.params.id, req.user.schoolId);
      return ApiResponse.success(res, null, "Holiday deleted successfully");
    } catch (error) {
      next(error);
    }
  }

  async getWorkingDaysCount(req, res, next) {
    try {
      const result = await holidaysService.getWorkingDaysCount(
        req.user.schoolId,
        req.query.startDate,
        req.query.endDate,
        req.query.academicYearId,
      );
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new HolidaysController();
