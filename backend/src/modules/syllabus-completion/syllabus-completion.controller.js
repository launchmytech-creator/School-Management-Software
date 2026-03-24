const syllabusCompletionService = require("./syllabus-completion.service");
const ApiResponse = require("../../utils/response");

class SyllabusCompletionController {
  async markCompletion(req, res, next) {
    try {
      const results = await syllabusCompletionService.markCompletion(
        req.body,
        req.user.schoolId,
        req.user.id,
      );
      return ApiResponse.success(
        res,
        results,
        `Syllabus completion marked for ${results.length} chapters`,
      );
    } catch (error) {
      next(error);
    }
  }

  async getCompletion(req, res, next) {
    try {
      const completion = await syllabusCompletionService.getCompletionBySchool(
        req.user.schoolId,
        req.query,
      );
      return ApiResponse.success(res, completion);
    } catch (error) {
      next(error);
    }
  }

  async getClassSubjectProgress(req, res, next) {
    try {
      const progress = await syllabusCompletionService.getClassSubjectProgress(
        req.params.classSubjectId,
        req.user.schoolId,
      );
      return ApiResponse.success(res, progress);
    } catch (error) {
      next(error);
    }
  }

  async getSubjectChapters(req, res, next) {
    try {
      const chapters = await syllabusCompletionService.getSubjectChapters(
        req.params.classSubjectId,
        req.user.schoolId,
      );
      return ApiResponse.success(res, chapters);
    } catch (error) {
      next(error);
    }
  }

  async deleteCompletion(req, res, next) {
    try {
      await syllabusCompletionService.deleteCompletion(
        req.params.id,
        req.user.schoolId,
      );
      return ApiResponse.success(
        res,
        null,
        "Syllabus completion record deleted successfully",
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SyllabusCompletionController();
