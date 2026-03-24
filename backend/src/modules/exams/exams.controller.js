const examsService = require("./exams.service");
const ApiResponse = require("../../utils/response");

class ExamsController {
  async createExam(req, res, next) {
    try {
      const exam = await examsService.createExam(req.body, req.user.schoolId);
      return ApiResponse.created(res, exam, "Exam created successfully");
    } catch (error) {
      next(error);
    }
  }

  async getExams(req, res, next) {
    try {
      const exams = await examsService.getExamsBySchool(
        req.user.schoolId,
        req.query,
      );
      return ApiResponse.success(res, exams);
    } catch (error) {
      next(error);
    }
  }

  async getExamById(req, res, next) {
    try {
      const exam = await examsService.getExamById(
        req.params.id,
        req.user.schoolId,
      );
      return ApiResponse.success(res, exam);
    } catch (error) {
      next(error);
    }
  }

  async updateExam(req, res, next) {
    try {
      const exam = await examsService.updateExam(
        req.params.id,
        req.body,
        req.user.schoolId,
      );
      return ApiResponse.success(res, exam, "Exam updated successfully");
    } catch (error) {
      next(error);
    }
  }

  async deleteExam(req, res, next) {
    try {
      await examsService.deleteExam(req.params.id, req.user.schoolId);
      return ApiResponse.success(res, null, "Exam deleted successfully");
    } catch (error) {
      next(error);
    }
  }

  async addExamSubject(req, res, next) {
    try {
      const examSubject = await examsService.addExamSubject(
        req.params.examId,
        req.body,
        req.user.schoolId,
      );
      return ApiResponse.created(
        res,
        examSubject,
        "Exam subject added successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async updateExamSubject(req, res, next) {
    try {
      const examSubject = await examsService.updateExamSubject(
        req.params.id,
        req.body,
        req.user.schoolId,
      );
      return ApiResponse.success(
        res,
        examSubject,
        "Exam subject updated successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteExamSubject(req, res, next) {
    try {
      await examsService.deleteExamSubject(req.params.id, req.user.schoolId);
      return ApiResponse.success(
        res,
        null,
        "Exam subject deleted successfully",
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ExamsController();
