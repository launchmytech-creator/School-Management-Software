const { body } = require("express-validator");

const sendNotificationValidation = [
  body("userId").isInt({ min: 1 }).withMessage("Valid userId is required"),
  body("subject").notEmpty().withMessage("Subject is required").isLength({ max: 200 }),
  body("message").notEmpty().withMessage("Message is required").isLength({ max: 2000 }),
  body("notificationType").optional().isLength({ max: 50 }),
  body("referenceType").optional().isLength({ max: 50 }),
  body("referenceId").optional().isInt({ min: 1 }),
];

const feeReminderValidation = [
  body("parentId").isInt({ min: 1 }).withMessage("Valid parentId is required"),
  body("studentName").notEmpty().withMessage("Student name is required"),
  body("amountDue").notEmpty().withMessage("Amount due is required"),
  body("dueDate").notEmpty().withMessage("Due date is required"),
];

const examResultValidation = [
  body("parentId").isInt({ min: 1 }).withMessage("Valid parentId is required"),
  body("studentName").notEmpty().withMessage("Student name is required"),
  body("examName").notEmpty().withMessage("Exam name is required"),
  body("grade").notEmpty().withMessage("Grade is required"),
  body("marks").isNumeric().withMessage("Marks must be a number"),
  body("totalMarks").isNumeric().withMessage("Total marks must be a number"),
];

const attendanceAlertValidation = [
  body("parentId").isInt({ min: 1 }).withMessage("Valid parentId is required"),
  body("studentName").notEmpty().withMessage("Student name is required"),
  body("date").notEmpty().withMessage("Date is required"),
  body("status")
    .isIn(["present", "absent", "late"])
    .withMessage("Status must be present, absent, or late"),
];

const broadcastValidation = [
  body("title").notEmpty().withMessage("Title is required").isLength({ max: 200 }),
  body("message").notEmpty().withMessage("Message is required").isLength({ max: 2000 }),
  body("targetRole")
    .optional()
    .isIn(["school_admin", "teacher", "parent", "accountant"])
    .withMessage("Invalid target role"),
];

module.exports = {
  sendNotificationValidation,
  feeReminderValidation,
  examResultValidation,
  attendanceAlertValidation,
  broadcastValidation,
};
