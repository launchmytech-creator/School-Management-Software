const classesService = require("./classes.service");
const ApiResponse = require("../../utils/response");

class ClassesController {
  async createClass(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const classData = req.body;

      const result = await classesService.createClass(classData, schoolId);

      return ApiResponse.created(res, result, "Class created successfully");
    } catch (error) {
      next(error);
    }
  }

  async getClasses(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const { academicYearId } = req.query;

      const classes = await classesService.getClassesBySchool(
        schoolId,
        academicYearId,
      );

      return ApiResponse.success(
        res,
        classes,
        "Classes retrieved successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async getClassesByIncharge(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const { teacherId } = req.params;
      const { academicYearId } = req.query;

      const classes = await classesService.getClassesByIncharge(
        teacherId,
        schoolId,
        academicYearId,
      );

      return ApiResponse.success(
        res,
        classes,
        "Classes retrieved successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async getClassById(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const { id } = req.params;

      const classData = await classesService.getClassById(id, schoolId);

      return ApiResponse.success(
        res,
        classData,
        "Class retrieved successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async updateClass(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const { id } = req.params;
      const updateData = req.body;

      const result = await classesService.updateClass(id, updateData, schoolId);

      return ApiResponse.success(res, result, "Class updated successfully");
    } catch (error) {
      next(error);
    }
  }

  async deleteClass(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const { id } = req.params;

      await classesService.deleteClass(id, schoolId);

      return ApiResponse.success(res, null, "Class deleted successfully");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ClassesController();
