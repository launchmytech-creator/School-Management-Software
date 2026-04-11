const reportsService = require("./reports.service");
const ApiResponse = require("../../utils/response");

class ReportsController {
  async getReport(req, res, next) {
    try {
      const { type } = req.query;
      let report;

      switch (type) {
        case "attendance":
          report = await reportsService.getAttendanceReport(req.user.schoolId, req.query);
          break;
        case "fees":
          report = await reportsService.getFeesReport(req.user.schoolId, req.query);
          break;
        case "results":
          report = await reportsService.getResultsReport(req.user.schoolId, req.query);
          break;
        case "summary":
          report = await reportsService.getSummaryReport(req.user.schoolId, req.query);
          break;
        default:
          throw new Error("Invalid report type");
      }

      return ApiResponse.success(res, report);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReportsController();
