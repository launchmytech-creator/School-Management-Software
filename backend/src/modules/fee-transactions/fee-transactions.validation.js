const { body } = require("express-validator");

const generateFeeTransactionsValidation = [
  body("classId")
    .notEmpty().withMessage("Class ID is required")
    .isInt().withMessage("Class ID must be an integer"),

  body("academicYearId")
    .notEmpty().withMessage("Academic year ID is required")
    .isInt().withMessage("Academic year ID must be an integer"),
];

const recordPaymentValidation = [
  body("amountPaid")
    .notEmpty()
    .withMessage("Amount paid is required")
    .isFloat({ gt: 0 })
    .withMessage("Amount paid must be a positive number"),

  body("paymentDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid date format, use ISO 8601 (YYYY-MM-DD)"),

  body("paymentMode")
    .notEmpty()
    .withMessage("Payment mode is required")
    .isIn(["cash", "card", "upi", "cheque", "bank_transfer"])
    .withMessage("Payment mode must be one of: cash, card, upi, cheque, bank_transfer"),

  body("receiptNumber")
    .optional()
    .isLength({ max: 50 })
    .withMessage("Receipt number must be at most 50 characters"),
];

const applyWaiverValidation = [
  body("waiverAmount")
    .notEmpty()
    .withMessage("Waiver amount is required")
    .isFloat({ gt: 0 })
    .withMessage("Waiver amount must be a positive number"),

  body("waiverReason")
    .notEmpty()
    .withMessage("Waiver reason is required")
    .isLength({ max: 500 })
    .withMessage("Waiver reason must be at most 500 characters"),
];

const updateFeeTransactionValidation = [
  body("dueDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid date format, use ISO 8601 (YYYY-MM-DD)"),
];

module.exports = {
  generateFeeTransactionsValidation,
  recordPaymentValidation,
  applyWaiverValidation,
  updateFeeTransactionValidation,
};
