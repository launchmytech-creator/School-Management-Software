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

  async getAllClassSubjects(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const { academicYearId } = req.query;

      const classSubjects = await classSubjectsService.getAllClassSubjects(
        schoolId,
        academicYearId,
      );

      return ApiResponse.success(
        res,
        classSubjects,
        "All class subjects retrieved successfully",
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
      const parsedId = parseInt(id, 10);

      if (isNaN(parsedId)) {
        return ApiResponse.error(res, 400, "Invalid class subject ID");
      }

      await classSubjectsService.removeSubjectFromClass(parsedId, schoolId);

      return ApiResponse.success(
        res,
        null,
        "Subject removed from class successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Assigns a subject to multiple classes. [NEW]
   * Body: { classIds: [], subjectId, academicYearId }
   * Validates inputs, returns count of successfully assigned classes.
   */
  async assignSubjectToMultipleClasses(req, res, next) {
    try {
      const { classIds, subjectId, academicYearId } = req.body;

      if (!classIds || !Array.isArray(classIds) || classIds.length === 0) {
        return ApiResponse.error(
          res,
          "At least one class must be selected",
          400,
        );
      }

      if (!subjectId) {
        return ApiResponse.error(res, "Subject ID is required", 400);
      }

      if (!academicYearId) {
        return ApiResponse.error(res, "Academic year is required", 400);
      }

      const result = await classSubjectsService.assignSubjectToMultipleClasses(
        classIds,
        subjectId,
        academicYearId,
        req.user.schoolId,
      );

      return ApiResponse.success(
        res,
        result,
        `Subject assigned to ${result.length} class(es) successfully`,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Checks existing assignments for given classes. [NEW]
   * Query params: ?classIds=1,2&academicYearId=1
   * Returns all existing class-subject assignments for those classes.
   */
  async checkExistingAssignments(req, res, next) {
    try {
      const { classIds, academicYearId } = req.query;

      if (!classIds) {
        return ApiResponse.error(res, "Class IDs are required", 400);
      }

      const classIdArray = classIds
        .split(",")
        .map((id) => parseInt(id))
        .filter((id) => !isNaN(id));

      if (classIdArray.length === 0) {
        return ApiResponse.error(res, "Invalid class IDs", 400);
      }

      const result = await classSubjectsService.checkExistingAssignments(
        classIdArray,
        academicYearId ? parseInt(academicYearId) : null,
        req.user.schoolId,
      );

      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ClassSubjectsController();
