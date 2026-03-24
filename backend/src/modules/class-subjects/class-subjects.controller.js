const classSubjectsService = require("./class-subjects.service");
const ApiResponse = require("../../utils/response");

class ClassSubjectsController {
  async assignSubjectToClass(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const assignmentData = req.body;

      const result = await classSubjectsService.assignSubjectToClass(
        assignmentData,
        schoolId,
      );

      return ApiResponse.created(
        res,
        result,
        "Subject assigned to class successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async getSubjectsByClass(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const { classId } = req.params;
      const { academicYearId } = req.query;

      const subjects = await classSubjectsService.getSubjectsByClass(
        classId,
        schoolId,
        academicYearId,
      );

      return ApiResponse.success(
        res,
        subjects,
        "Class subjects retrieved successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async getClassesBySubject(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const { subjectId } = req.params;
      const { academicYearId } = req.query;

      const classes = await classSubjectsService.getClassesBySubject(
        subjectId,
        schoolId,
        academicYearId,
      );

      return ApiResponse.success(
        res,
        classes,
        "Subject classes retrieved successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async getClassSubjectById(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const { id } = req.params;

      const classSubject = await classSubjectsService.getClassSubjectById(
        id,
        schoolId,
      );

      return ApiResponse.success(
        res,
        classSubject,
        "Class subject retrieved successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async updateClassSubject(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const { id } = req.params;
      const updateData = req.body;

      const result = await classSubjectsService.updateClassSubject(
        id,
        updateData,
        schoolId,
      );

      return ApiResponse.success(
        res,
        result,
        "Class subject updated successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async removeSubjectFromClass(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const { id } = req.params;

      await classSubjectsService.removeSubjectFromClass(id, schoolId);

      return ApiResponse.success(
        res,
        null,
        "Subject removed from class successfully",
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ClassSubjectsController();
