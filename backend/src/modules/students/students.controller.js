const studentsService = require("./students.service");
const ApiResponse = require("../../utils/response");

class StudentsController {
  async createStudent(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const studentData = req.body;

      const result = await studentsService.createStudent(studentData, schoolId);

      return ApiResponse.created(res, result, "Student created successfully");
    } catch (error) {
      next(error);
    }
  }

  async getStudents(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const { classId, status } = req.query;

      const students = await studentsService.getStudentsBySchool(schoolId, {
        classId,
        status,
      });

      return ApiResponse.success(
        res,
        students,
        "Students retrieved successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async getStudentById(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const { id } = req.params;

      const student = await studentsService.getStudentById(id, schoolId);

      return ApiResponse.success(
        res,
        student,
        "Student retrieved successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async updateStudent(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const { id } = req.params;
      const updateData = req.body;

      const result = await studentsService.updateStudent(
        id,
        updateData,
        schoolId,
      );

      return ApiResponse.success(res, result, "Student updated successfully");
    } catch (error) {
      next(error);
    }
  }

  async deleteStudent(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const { id } = req.params;

      await studentsService.deleteStudent(id, schoolId);

      return ApiResponse.success(res, null, "Student deactivated successfully");
    } catch (error) {
      next(error);
    }
  }

  // [NEW] Get comprehensive student history
  async getStudentHistory(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const { id } = req.params;

      const history = await studentsService.getStudentHistory(parseInt(id, 10), schoolId);

      return ApiResponse.success(res, history, "Student history retrieved successfully");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new StudentsController();
