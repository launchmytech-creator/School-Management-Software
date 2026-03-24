const chaptersService = require("./chapters.service");
const ApiResponse = require("../../utils/response");

class ChaptersController {
  async createChapter(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const chapterData = req.body;

      const result = await chaptersService.createChapter(chapterData, schoolId);

      return ApiResponse.created(res, result, "Chapter created successfully");
    } catch (error) {
      next(error);
    }
  }

  async getChaptersBySubject(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const { subjectId } = req.params;

      const chapters = await chaptersService.getChaptersBySubject(
        subjectId,
        schoolId,
      );

      return ApiResponse.success(
        res,
        chapters,
        "Chapters retrieved successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async getChapterById(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const { id } = req.params;

      const chapter = await chaptersService.getChapterById(id, schoolId);

      return ApiResponse.success(
        res,
        chapter,
        "Chapter retrieved successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async updateChapter(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const { id } = req.params;
      const updateData = req.body;

      const result = await chaptersService.updateChapter(
        id,
        updateData,
        schoolId,
      );

      return ApiResponse.success(res, result, "Chapter updated successfully");
    } catch (error) {
      next(error);
    }
  }

  async deleteChapter(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const { id } = req.params;

      await chaptersService.deleteChapter(id, schoolId);

      return ApiResponse.success(res, null, "Chapter deleted successfully");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ChaptersController();
