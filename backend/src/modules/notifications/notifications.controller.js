const notificationsService = require("./notifications.service");
const ApiResponse = require("../../utils/response");

class NotificationsController {
  /**
   * POST /notifications/send
   * Send a generic notification to a specific user.
   */
  async sendNotification(req, res, next) {
    try {
      const { userId, subject, message, notificationType, referenceType, referenceId } = req.body;

      const result = await notificationsService.sendGenericNotification({
        userId,
        subject,
        message,
        notificationType,
        referenceType,
        referenceId,
      });

      return ApiResponse.created(res, result, "Notification sent successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /notifications/fee-reminder
   * Send a fee payment reminder to a parent.
   */
  async sendFeeReminder(req, res, next) {
    try {
      const { parentId, studentName, amountDue, dueDate } = req.body;

      const result = await notificationsService.sendFeeReminder({
        parentId,
        studentName,
        amountDue,
        dueDate,
      });

      return ApiResponse.created(res, result, "Fee reminder sent successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /notifications/exam-result
   * Notify a parent about exam results.
   */
  async sendExamResult(req, res, next) {
    try {
      const { parentId, studentName, examName, grade, marks, totalMarks, examId } = req.body;

      const result = await notificationsService.sendExamResultNotification({
        parentId,
        studentName,
        examName,
        grade,
        marks,
        totalMarks,
        examId,
      });

      return ApiResponse.created(res, result, "Exam result notification sent");
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /notifications/attendance-alert
   * Notify a parent about student attendance.
   */
  async sendAttendanceAlert(req, res, next) {
    try {
      const { parentId, studentName, date, status, studentId } = req.body;

      const result = await notificationsService.sendAttendanceAlert({
        parentId,
        studentName,
        date,
        status,
        studentId,
      });

      return ApiResponse.created(res, result, "Attendance alert sent");
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /notifications/broadcast
   * Broadcast an announcement to all users (or a specific role) in a school.
   */
  async broadcastAnnouncement(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const sentBy = req.user.id;
      const { title, message, targetRole, announcementId } = req.body;

      const result = await notificationsService.broadcastAnnouncement({
        schoolId,
        title,
        message,
        targetRole,
        announcementId,
        sentBy,
      });

      return ApiResponse.success(res, result, "Broadcast completed");
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /notifications/my
   * Get notifications for the authenticated user.
   */
  async getMyNotifications(req, res, next) {
    try {
      const userId = req.user.id;
      const { status, type, limit, offset } = req.query;

      const notifications = await notificationsService.getUserNotifications(userId, {
        status,
        type,
        limit: limit ? parseInt(limit) : 50,
        offset: offset ? parseInt(offset) : 0,
      });

      return ApiResponse.success(res, notifications, "Notifications retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /notifications
   * Get all notifications for the school (admin only).
   */
  async getSchoolNotifications(req, res, next) {
    try {
      const schoolId = req.user.schoolId;
      const { status, type, limit, offset } = req.query;

      const notifications = await notificationsService.getSchoolNotifications(schoolId, {
        status,
        type,
        limit: limit ? parseInt(limit) : 100,
        offset: offset ? parseInt(offset) : 0,
      });

      return ApiResponse.success(res, notifications, "Notifications retrieved successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /notifications/retry-failed
   * Retry all failed email notifications for the school.
   */
  async retryFailed(req, res, next) {
    try {
      const schoolId = req.user.schoolId;

      const result = await notificationsService.retryFailed(schoolId);

      return ApiResponse.success(res, result, "Retry completed");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NotificationsController();
