const studentPromotionsService = require("./student-promotions.service");
const ApiResponse = require("../../utils/response");

class StudentPromotionsController {
  async promoteStudents(req, res, next) {
    try {
      const result = await studentPromotionsService.promoteStudents(
        req.body,
        req.user.schoolId,
        req.user.id,
      );
      return ApiResponse.success(
        res,
        result,
        `Successfully promoted ${result.length} students`,
      );
    } catch (error) {
      next(error);
    }
  }

  async getPromotions(req, res, next) {
    try {
      const promotions = await studentPromotionsService.getPromotionsBySchool(
        req.user.schoolId,
        req.query,
      );
      return ApiResponse.success(res, promotions);
    } catch (error) {
      next(error);
    }
  }

  async getStudentPromotionHistory(req, res, next) {
    try {
      const history = await studentPromotionsService.getStudentPromotionHistory(
        req.params.studentId,
        req.user.schoolId,
      );
      return ApiResponse.success(res, history);
    } catch (error) {
      next(error);
    }
  }

  async getPromotionById(req, res, next) {
    try {
      const promotion = await studentPromotionsService.getPromotionById(
        req.params.id,
        req.user.schoolId,
      );
      return ApiResponse.success(res, promotion);
    } catch (error) {
      next(error);
    }
  }

  async getEligibleStudents(req, res, next) {
    try {
      const students = await studentPromotionsService.getEligibleStudents(
        req.params.classId,
        req.user.schoolId,
      );
      return ApiResponse.success(res, students);
    } catch (error) {
      next(error);
    }
  }

  async deletePromotion(req, res, next) {
    try {
      await studentPromotionsService.deletePromotion(
        req.params.id,
        req.user.schoolId,
      );
      return ApiResponse.success(
        res,
        null,
        "Promotion record deleted successfully",
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new StudentPromotionsController();
