const feeStructuresService = require("./fee-structures.service");
const ApiResponse = require("../../utils/response");

class FeeStructuresController {
  async createFeeStructure(req, res, next) {
    try {
      const feeStructure = await feeStructuresService.createFeeStructure(
        req.body,
        req.user.schoolId,
      );
      return ApiResponse.created(
        res,
        feeStructure,
        "Fee structure created successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async getFeeStructures(req, res, next) {
    try {
      const feeStructures = await feeStructuresService.getFeeStructuresBySchool(
        req.user.schoolId,
        req.query,
      );
      return ApiResponse.success(res, feeStructures);
    } catch (error) {
      next(error);
    }
  }

  async getFeeStructureById(req, res, next) {
    try {
      const feeStructure = await feeStructuresService.getFeeStructureById(
        req.params.id,
        req.user.schoolId,
      );
      return ApiResponse.success(res, feeStructure);
    } catch (error) {
      next(error);
    }
  }

  async updateFeeStructure(req, res, next) {
    try {
      const feeStructure = await feeStructuresService.updateFeeStructure(
        req.params.id,
        req.body,
        req.user.schoolId,
      );
      return ApiResponse.success(
        res,
        feeStructure,
        "Fee structure updated successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteFeeStructure(req, res, next) {
    try {
      await feeStructuresService.deleteFeeStructure(
        req.params.id,
        req.user.schoolId,
      );
      return ApiResponse.success(
        res,
        null,
        "Fee structure deleted successfully",
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FeeStructuresController();
