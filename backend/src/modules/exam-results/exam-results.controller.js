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

  async getClassComparison(req, res, next) {
    try {
      const { classIds, academicYearId, examType } = req.query;
      console.log(classIds, academicYearId, examType);
      let parsedClassIds;
      if (typeof classIds === "string") {
        parsedClassIds = classIds
          .split(",")
          .map((id) => parseInt(id.trim()))
          .filter((id) => !isNaN(id));
      } else if (Array.isArray(classIds)) {
        parsedClassIds = classIds
          .map((id) => parseInt(id))
          .filter((id) => !isNaN(id));
      }

      const comparison = await examResultsService.getClassComparison(
        {
          classIds: parsedClassIds,
          academicYearId: academicYearId ? parseInt(academicYearId) : null,
          examType: examType || null,
        },
        req.user.schoolId,
      );
      return ApiResponse.success(res, comparison);
    } catch (error) {
      next(error);
    }
  }

  async getClassesForComparison(req, res, next) {
    try {
      const { className, academicYearId } = req.query;

      if (!className) {
        return ApiResponse.error(res, "Class name is required", 400);
      }

      const classes = await examResultsService.getClassesForComparison(
        className,
        req.user.schoolId,
        academicYearId ? parseInt(academicYearId) : null,
      );
      return ApiResponse.success(res, classes);
    } catch (error) {
      next(error);
    }
  }

  async getClassSubjectComparison(req, res, next) {
    try {
      const { classIds, academicYearId } = req.query;
      console.log("Subject Comparison - classIds:", classIds, "academicYearId:", academicYearId);

      let parsedClassIds;
      if (typeof classIds === "string") {
        parsedClassIds = classIds
          .split(",")
          .map((id) => parseInt(id.trim()))
          .filter((id) => !isNaN(id));
      } else if (Array.isArray(classIds)) {
        parsedClassIds = classIds
          .map((id) => parseInt(id))
          .filter((id) => !isNaN(id));
      }

      if (!parsedClassIds || parsedClassIds.length === 0) {
        return ApiResponse.error(res, "At least one class ID is required", 400);
      }

      const comparison = await examResultsService.getClassSubjectComparison(
        parsedClassIds,
        req.user.schoolId,
        academicYearId ? parseInt(academicYearId) : null,
      );
      return ApiResponse.success(res, comparison);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ExamResultsController();
