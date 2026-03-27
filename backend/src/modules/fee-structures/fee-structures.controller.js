const feeStructuresService = require("./fee-structures.service");
const ApiResponse = require("../../utils/response");

class FeeStructuresController {
  async createFeeStructure(req, res, next) {
    try {
      const result = await feeStructuresService.createFeeStructure(req.body, req.user.schoolId);
      return ApiResponse.created(res, result, "Fee component added successfully");
    } catch (error) {
      next(error);
    }
  }

  // All individual fee component rows
  async getFeeStructures(req, res, next) {
    try {
      const data = await feeStructuresService.getFeeStructuresBySchool(req.user.schoolId, req.query);
      return ApiResponse.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  // Grouped view: one entry per class+year with totals and per-term amount
  async getFeeStructuresGrouped(req, res, next) {
    try {
      const data = await feeStructuresService.getFeeStructuresGrouped(req.user.schoolId, req.query);
      return ApiResponse.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  async getFeeStructureById(req, res, next) {
    try {
      const data = await feeStructuresService.getFeeStructureById(req.params.id, req.user.schoolId);
      return ApiResponse.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  async updateFeeStructure(req, res, next) {
    try {
      const data = await feeStructuresService.updateFeeStructure(req.params.id, req.body, req.user.schoolId);
      return ApiResponse.success(res, data, "Fee component updated successfully");
    } catch (error) {
      next(error);
    }
  }

  async deleteFeeStructure(req, res, next) {
    try {
      await feeStructuresService.deleteFeeStructure(req.params.id, req.user.schoolId);
      return ApiResponse.success(res, null, "Fee component deleted successfully");
    } catch (error) {
      next(error);
    }
  }

  // Delete all components for a class+year group
  async deleteFeeStructureGroup(req, res, next) {
    try {
      const { classId, academicYearId } = req.query;
      if (!classId || !academicYearId) {
        return ApiResponse.error(res, "classId and academicYearId are required", 400);
      }
      const result = await feeStructuresService.deleteFeeStructureGroup(
        req.user.schoolId, classId, academicYearId
      );
      return ApiResponse.success(res, result, "All fee components deleted for this class and year");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FeeStructuresController();
