const feeTransactionsService = require("./fee-transactions.service");
const ApiResponse = require("../../utils/response");

class FeeTransactionsController {
  async generateFeeTransactions(req, res, next) {
    try {
      const result = await feeTransactionsService.generateFeeTransactions(
        req.body,
        req.user.schoolId,
        req.user.id,
      );
      return ApiResponse.created(
        res,
        result,
        `Generated ${result.count} fee transactions successfully`,
      );
    } catch (error) {
      next(error);
    }
  }

  async getFeeTransactions(req, res, next) {
    try {
      const transactions =
        await feeTransactionsService.getFeeTransactionsBySchool(
          req.user.schoolId,
          req.query,
        );
      return ApiResponse.success(res, transactions);
    } catch (error) {
      next(error);
    }
  }

  async getFeeDefaulters(req, res, next) {
    try {
      const defaulters = await feeTransactionsService.getFeeDefaulters(
        req.user.schoolId,
        req.query,
      );
      return ApiResponse.success(res, defaulters);
    } catch (error) {
      next(error);
    }
  }

  async getStudentFeeTransactions(req, res, next) {
    try {
      const transactions =
        await feeTransactionsService.getStudentFeeTransactions(
          req.params.studentId,
          req.user.schoolId,
        );
      return ApiResponse.success(res, transactions);
    } catch (error) {
      next(error);
    }
  }

  async getFeeTransactionById(req, res, next) {
    try {
      const transaction = await feeTransactionsService.getFeeTransactionById(
        req.params.id,
        req.user.schoolId,
      );
      return ApiResponse.success(res, transaction);
    } catch (error) {
      next(error);
    }
  }

  async recordPayment(req, res, next) {
    try {
      const transaction = await feeTransactionsService.recordPayment(
        req.params.id,
        req.body,
        req.user.schoolId,
        req.user.id,
      );
      return ApiResponse.success(
        res,
        transaction,
        "Payment recorded successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async applyWaiver(req, res, next) {
    try {
      const transaction = await feeTransactionsService.applyWaiver(
        req.params.id,
        req.body,
        req.user.schoolId,
        req.user.id,
      );
      return ApiResponse.success(
        res,
        transaction,
        "Fee waiver applied successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  async updateFeeTransaction(req, res, next) {
    try {
      const transaction = await feeTransactionsService.updateFeeTransaction(
        req.params.id,
        req.body,
        req.user.schoolId,
      );
      return ApiResponse.success(
        res,
        transaction,
        "Fee transaction updated successfully",
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FeeTransactionsController();
