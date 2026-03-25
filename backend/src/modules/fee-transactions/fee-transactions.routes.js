const express = require("express");
const router = express.Router();
const feeTransactionsController = require("./fee-transactions.controller");
const { authenticate, authorize } = require("../../middleware/auth");
const validate = require("../../middleware/validator");
const {
  generateFeeTransactionsValidation,
  updateFeeTransactionValidation,
  applyWaiverValidation,
  recordPaymentValidation,
} = require("./fee-transactions.validation");
const { ROLES } = require("../../constants");

router.use(authenticate);

router.post(
  "/generate",
  authorize(ROLES.SCHOOL_ADMIN),
  generateFeeTransactionsValidation,
  validate,
  feeTransactionsController.generateFeeTransactions,
);

router.get(
  "/",
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT),
  feeTransactionsController.getFeeTransactions,
);

router.get(
  "/defaulters",
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT),
  feeTransactionsController.getFeeDefaulters,
);

router.get(
  "/student/:studentId",
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT, ROLES.PARENT),
  feeTransactionsController.getStudentFeeTransactions,
);

router.get(
  "/:id",
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT),
  feeTransactionsController.getFeeTransactionById,
);

router.patch(
  "/:id/payment",
  authorize(ROLES.SCHOOL_ADMIN, ROLES.ACCOUNTANT),
  recordPaymentValidation,
  validate,
  feeTransactionsController.recordPayment,
);

router.patch(
  "/:id/waiver",
  authorize(ROLES.SCHOOL_ADMIN),
  applyWaiverValidation,
  validate,
  feeTransactionsController.applyWaiver,
);

router.patch(
  "/:id",
  authorize(ROLES.SCHOOL_ADMIN),
  updateFeeTransactionValidation,
  validate,
  feeTransactionsController.updateFeeTransaction,
);

module.exports = router;
