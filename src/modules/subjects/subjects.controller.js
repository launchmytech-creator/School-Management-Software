const subjectsService = require("./subjects.service");
const ApiResponse = require("../../utils/response");

class SubjectsController {
  async createSubject(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const subjectData = req.body;

      const result = await subjectsService.createSubject(subjectData, schoolId);

      return ApiResponse.created(res, result, "Subject created successfully");
    } catch (error) {
      next(error);
    }
  }

  async getSubjects(req, res, next) {
    try {
      const schoolId = req.user.schoolId;

      const subjects = await subjectsService.getSubjectsBySchool(schoolId);

      return ApiResponse.success(
        res,
        subjects,
        "Subjects retrieved successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async getSubjectById(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const { id } = req.params;

      const subject = await subjectsService.getSubjectById(id, schoolId);

      return ApiResponse.success(
        res,
        subject,
        "Subject retrieved successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async updateSubject(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const { id } = req.params;
      const updateData = req.body;

      const result = await subjectsService.updateSubject(
        id,
        updateData,
        schoolId,
      );

      return ApiResponse.success(res, result, "Subject updated successfully");
    } catch (error) {
      next(error);
    }
  }

  async deleteSubject(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const { id } = req.params;

      await subjectsService.deleteSubject(id, schoolId);

      return ApiResponse.success(res, null, "Subject deleted successfully");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SubjectsController();
