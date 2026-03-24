const teachersService = require("./teachers.service");
const ApiResponse = require("../../utils/response");

class TeachersController {
  async createTeacher(req, res, next) {
    try {
      const teacherData = req.body;
      const schoolId = req.user.schoolId;

      const teacher = await teachersService.createTeacher(
        teacherData,
        schoolId,
      );

      return ApiResponse.created(res, teacher, "Teacher created successfully");
    } catch (error) {
      next(error);
    }
  }

  async getTeachers(req, res, next) {
    try {
      const schoolId = req.user.schoolId;

      const teachers = await teachersService.getTeachersBySchool(schoolId);

      return ApiResponse.success(
        res,
        teachers,
        "Teachers retrieved successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async getTeacherById(req, res, next) {
    try {
      const { id } = req.params;
      const schoolId = req.user.schoolId;

      const teacher = await teachersService.getTeacherById(id, schoolId);

      return ApiResponse.success(
        res,
        teacher,
        "Teacher retrieved successfully",
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TeachersController();
