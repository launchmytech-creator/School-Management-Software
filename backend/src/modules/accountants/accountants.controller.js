const accountantsService = require("./accountants.service");
const ApiResponse = require("../../utils/response");

class AccountantsController {
  async createAccountant(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const accountantData = req.body;

      const result = await accountantsService.createAccountant(
        accountantData,
        schoolId,
      );

      return ApiResponse.created(
        res,
        result,
        "Accountant created successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async getAccountants(req, res, next) {
    try {
      const schoolId = req.user.schoolId;

      const accountants =
        await accountantsService.getAccountantsBySchool(schoolId);

      return ApiResponse.success(
        res,
        accountants,
        "Accountants retrieved successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async getAccountantById(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const { id } = req.params;

      const accountant = await accountantsService.getAccountantById(
        id,
        schoolId,
      );

      return ApiResponse.success(
        res,
        accountant,
        "Accountant retrieved successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async updateAccountant(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const { id } = req.params;
      const updateData = req.body;

      const result = await accountantsService.updateAccountant(
        id,
        updateData,
        schoolId,
      );

      return ApiResponse.success(
        res,
        result,
        "Accountant updated successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteAccountant(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const { id } = req.params;

      await accountantsService.deleteAccountant(id, schoolId);

      return ApiResponse.success(
        res,
        null,
        "Accountant deactivated successfully",
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AccountantsController();
