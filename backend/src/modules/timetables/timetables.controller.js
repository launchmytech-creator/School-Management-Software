const timetablesService = require("./timetables.service");
const ApiResponse = require("../../utils/response");

class TimetablesController {
  async createTimetable(req, res, next) {
    try {
      const timetable = await timetablesService.createTimetableEntry(
        req.body,
        req.user.schoolId,
      );
      return ApiResponse.created(res, timetable, "Timetable entry created successfully");
    } catch (error) {
      next(error);
    }
  }

  async getTimetables(req, res, next) {
    try {
      const timetables = await timetablesService.getTimetables(
        req.user.schoolId,
        req.query,
      );
      return ApiResponse.success(res, timetables);
    } catch (error) {
      next(error);
    }
  }

  async getTimetableById(req, res, next) {
    try {
      const timetable = await timetablesService.getTimetableById(
        req.params.id,
        req.user.schoolId,
      );
      return ApiResponse.success(res, timetable);
    } catch (error) {
      next(error);
    }
  }

  async updateTimetable(req, res, next) {
    try {
      const timetable = await timetablesService.updateTimetable(
        req.params.id,
        req.body,
        req.user.schoolId,
      );
      return ApiResponse.success(res, timetable, "Timetable entry updated successfully");
    } catch (error) {
      next(error);
    }
  }

  async deleteTimetable(req, res, next) {
    try {
      await timetablesService.deleteTimetable(req.params.id, req.user.schoolId);
      return ApiResponse.success(res, null, "Timetable entry deleted successfully");
    } catch (error) {
      next(error);
    }
  }

  async bulkCreateTimetable(req, res, next) {
    try {
      const timetables = await timetablesService.bulkCreateTimetable(
        req.body.entries,
        req.user.schoolId,
      );
      return ApiResponse.created(res, timetables, "Timetable entries created successfully");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TimetablesController();
