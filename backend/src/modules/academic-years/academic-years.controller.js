const academicYearsService = require("./academic-years.service");
const ApiResponse = require("../../utils/response");

class AcademicYearsController {
  async createAcademicYear(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const yearData = req.body;

      const result = await academicYearsService.createAcademicYear(
        yearData,
        schoolId,
      );

      return ApiResponse.created(
        res,
        result,
        "Academic year created successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async getAcademicYears(req, res, next) {
    try {
      const schoolId = req.user.schoolId;

      const years =
        await academicYearsService.getAcademicYearsBySchool(schoolId);

      return ApiResponse.success(
        res,
        years,
        "Academic years retrieved successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async getAcademicYearById(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const { id } = req.params;

      const year = await academicYearsService.getAcademicYearById(id, schoolId);

      return ApiResponse.success(
        res,
        year,
        "Academic year retrieved successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async getCurrentAcademicYear(req, res, next) {
    try {
      const schoolId = req.user.schoolId;

      const year = await academicYearsService.getCurrentAcademicYear(schoolId);

      return ApiResponse.success(
        res,
        year,
        "Current academic year retrieved successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async updateAcademicYear(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const { id } = req.params;
      const updateData = req.body;

      const result = await academicYearsService.updateAcademicYear(
        id,
        updateData,
        schoolId,
      );

      return ApiResponse.success(
        res,
        result,
        "Academic year updated successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async setCurrentAcademicYear(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const { id } = req.params;

      const result = await academicYearsService.setCurrentAcademicYear(
        id,
        schoolId,
      );

      return ApiResponse.success(
        res,
        result,
        "Current academic year set successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteAcademicYear(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const { id } = req.params;

      await academicYearsService.deleteAcademicYear(id, schoolId);

      return ApiResponse.success(
        res,
        null,
        "Academic year deleted successfully",
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AcademicYearsController();
