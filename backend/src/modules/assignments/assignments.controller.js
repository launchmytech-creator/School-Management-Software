const assignmentsService = require("./assignments.service");
const ApiResponse = require("../../utils/response");

class AssignmentsController {
  async createAssignment(req, res, next) {
    try {
      const assignment = await assignmentsService.createAssignment(
        req.body,
        req.user.schoolId,
        req.user.id,
      );
      return ApiResponse.created(res, assignment, "Assignment created successfully");
    } catch (error) {
      next(error);
    }
  }

  async getAssignments(req, res, next) {
    try {
      const assignments = await assignmentsService.getAssignments(
        req.user.schoolId,
        req.query,
      );
      return ApiResponse.success(res, assignments);
    } catch (error) {
      next(error);
    }
  }

  async getAssignmentById(req, res, next) {
    try {
      const assignment = await assignmentsService.getAssignmentById(
        req.params.id,
        req.user.schoolId,
      );
      return ApiResponse.success(res, assignment);
    } catch (error) {
      next(error);
    }
  }

  async updateAssignment(req, res, next) {
    try {
      const assignment = await assignmentsService.updateAssignment(
        req.params.id,
        req.body,
        req.user.schoolId,
      );
      return ApiResponse.success(res, assignment, "Assignment updated successfully");
    } catch (error) {
      next(error);
    }
  }

  async deleteAssignment(req, res, next) {
    try {
      await assignmentsService.deleteAssignment(req.params.id, req.user.schoolId);
      return ApiResponse.success(res, null, "Assignment deleted successfully");
    } catch (error) {
      next(error);
    }
  }

  async submitAssignment(req, res, next) {
    try {
      const submission = await assignmentsService.submitAssignment(
        req.params.id,
        req.user.id,
        req.body,
      );
      return ApiResponse.created(res, submission, "Assignment submitted successfully");
    } catch (error) {
      next(error);
    }
  }

  async gradeSubmission(req, res, next) {
    try {
      const submission = await assignmentsService.gradeSubmission(
        req.params.submissionId,
        req.body,
        req.user.id,
      );
      return ApiResponse.success(res, submission, "Submission graded successfully");
    } catch (error) {
      next(error);
    }
  }

  async getSubmissions(req, res, next) {
    try {
      const submissions = await assignmentsService.getSubmissions(
        req.params.id,
        req.user.schoolId,
      );
      return ApiResponse.success(res, submissions);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AssignmentsController();
