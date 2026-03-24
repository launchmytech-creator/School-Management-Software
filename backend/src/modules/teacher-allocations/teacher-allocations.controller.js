const teacherAllocationsService = require("./teacher-allocations.service");
const ApiResponse = require("../../utils/response");

class TeacherAllocationsController {
  async allocateTeacher(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const allocationData = req.body;

      const result = await teacherAllocationsService.allocateTeacher(
        allocationData,
        schoolId,
      );

      return ApiResponse.created(res, result, "Teacher allocated successfully");
    } catch (error) {
      next(error);
    }
  }

  async getAllocationsByTeacher(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const { teacherId } = req.params;
      const { academicYearId } = req.query;

      const allocations =
        await teacherAllocationsService.getAllocationsByTeacher(
          teacherId,
          schoolId,
          academicYearId,
        );

      return ApiResponse.success(
        res,
        allocations,
        "Teacher allocations retrieved successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async getAllocationsByClass(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const { classId } = req.params;
      const { academicYearId } = req.query;

      const allocations = await teacherAllocationsService.getAllocationsByClass(
        classId,
        schoolId,
        academicYearId,
      );

      return ApiResponse.success(
        res,
        allocations,
        "Class allocations retrieved successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async getAllAllocations(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const { academicYearId } = req.query;

      const allocations =
        await teacherAllocationsService.getAllocationsBySchool(
          schoolId,
          academicYearId,
        );

      return ApiResponse.success(
        res,
        allocations,
        "Allocations retrieved successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async getAllocationById(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const { id } = req.params;

      const allocation = await teacherAllocationsService.getAllocationById(
        id,
        schoolId,
      );

      return ApiResponse.success(
        res,
        allocation,
        "Allocation retrieved successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async removeAllocation(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const { id } = req.params;

      await teacherAllocationsService.removeAllocation(id, schoolId);

      return ApiResponse.success(
        res,
        null,
        "Teacher allocation removed successfully",
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TeacherAllocationsController();
