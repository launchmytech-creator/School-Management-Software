const examResultsService = require("./exam-results.service");
const ApiResponse = require("../../utils/response");

class ExamResultsController {
  async enterMarks(req, res, next) {
    try {
      const results = await examResultsService.enterMarks(
        req.body,
        req.user.schoolId,
        req.user.id,
      );
      return ApiResponse.success(
        res,
        results,
        `Marks entered for ${results.length} students`,
      );
    } catch (error) {
      next(error);
    }
  }

  async getResults(req, res, next) {
    try {
      const results = await examResultsService.getResultsBySchool(
        req.user.schoolId,
        req.query,
      );
      return ApiResponse.success(res, results);
    } catch (error) {
      next(error);
    }
  }

  async getStudentResults(req, res, next) {
    try {
      const results = await examResultsService.getStudentResults(
        req.params.studentId,
        req.user.schoolId,
        req.query,
      );
      return ApiResponse.success(res, results);
    } catch (error) {
      next(error);
    }
  }

  async getExamSubjectResults(req, res, next) {
    try {
      const results = await examResultsService.getExamSubjectResults(
        req.params.examSubjectId,
        req.user.schoolId,
      );
      return ApiResponse.success(res, results);
    } catch (error) {
      next(error);
    }
  }

  async getClassPerformance(req, res, next) {
    try {
      const performance = await examResultsService.getClassPerformance(
        req.params.examId,
        req.user.schoolId,
      );
      return ApiResponse.success(res, performance);
    } catch (error) {
      next(error);
    }
  }

  async deleteResult(req, res, next) {
    try {
      await examResultsService.deleteResult(req.params.id, req.user.schoolId);
      return ApiResponse.success(res, null, "Exam result deleted successfully");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ExamResultsController();
