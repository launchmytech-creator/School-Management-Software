const pool = require("../../database/connection");
const emailService = require("../../utils/emailService");
const emailTemplates = require("../../utils/emailTemplates");
const AppError = require("../../utils/AppError");
const { ERROR_CODES } = require("../../constants");
const logger = require("../../utils/logger");

class NotificationsService {
  // ─── Internal helpers ────────────────────────────────────────────────────────

  /**
   * Persist a notification record and attempt email delivery.
   * Returns the saved notification row.
   */
  async _createAndSend({ userId, schoolId, notificationType, message, referenceType, referenceId, emailPayload }) {
    // 1. Persist with status = pending
    const insertResult = await pool.query(
      `INSERT INTO notifications
         (user_id, notification_type, message, reference_type, reference_id, channel, status)
       VALUES ($1, $2, $3, $4, $5, 'email', 'pending')
       RETURNING *`,
      [userId, notificationType, message, referenceType || null, referenceId || null],
    );

    const notification = insertResult.rows[0];

    // 2. Send email
    try {
      await emailService.sendMail(emailPayload);

      await pool.query(
        `UPDATE notifications SET status = 'sent', sent_at = NOW() WHERE id = $1`,
        [notification.id],
      );

      notification.status = "sent";
      notification.sent_at = new Date();
    } catch (emailErr) {
      // Mark failed but don't throw — the record is saved for retry
      await pool.query(
        `UPDATE notifications SET status = 'failed' WHERE id = $1`,
        [notification.id],
      );
      notification.status = "failed";
      logger.error("Email delivery failed", { notificationId: notification.id, error: emailErr.message });
    }

    return notification;
  }

  /** Fetch user + school info needed for email composition */
  async _getUserWithSchool(userId) {
    const result = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.role, s.name as school_name
       FROM users u
       LEFT JOIN schools s ON u.school_id = s.id
       WHERE u.id = $1 AND u.is_active = true`,
      [userId],
    );
    if (!result.rows.length) {
      throw new AppError(ERROR_CODES.USER_NOT_FOUND, "User not found", 404);
    }
    return result.rows[0];
  }

  // ─── Public API ──────────────────────────────────────────────────────────────

  /**
   * Send a generic custom notification to any user.
   */
  async sendGenericNotification({ userId, subject, message, notificationType = "general", referenceType, referenceId }) {
    const user = await this._getUserWithSchool(userId);

    const html = emailTemplates.generic({
      recipientName: user.full_name,
      subject,
      message,
      schoolName: user.school_name,
    });

    return this._createAndSend({
      userId,
      notificationType,
      message,
      referenceType,
      referenceId,
      emailPayload: { to: user.email, subject, html, fromName: user.school_name },
    });
  }

  /**
   * Send a fee payment reminder to a parent.
   */
  async sendFeeReminder({ parentId, studentName, amountDue, dueDate }) {
    const parent = await this._getUserWithSchool(parentId);

    const message = `Fee reminder for ${studentName}. Amount due: ${amountDue}. Due date: ${dueDate}.`;
    const html = emailTemplates.feeReminder({
      recipientName: parent.full_name,
      studentName,
      amountDue,
      dueDate,
      schoolName: parent.school_name,
    });

    return this._createAndSend({
      userId: parentId,
      notificationType: "fee_reminder",
      message,
      referenceType: "fee",
      emailPayload: { to: parent.email, subject: "Fee Payment Reminder", html, fromName: parent.school_name },
    });
  }

  /**
   * Send exam result notification.
   */
  async sendExamResultNotification({ parentId, studentName, examName, grade, marks, totalMarks, examId }) {
    const parent = await this._getUserWithSchool(parentId);

    const message = `Exam results available for ${studentName}. ${examName}: ${marks}/${totalMarks} (${grade}).`;
    const html = emailTemplates.examResult({
      recipientName: parent.full_name,
      studentName,
      examName,
      grade,
      marks,
      totalMarks,
      schoolName: parent.school_name,
    });

    return this._createAndSend({
      userId: parentId,
      notificationType: "exam_result",
      message,
      referenceType: "exam",
      referenceId: examId,
      emailPayload: { to: parent.email, subject: `Exam Results: ${examName}`, html, fromName: parent.school_name },
    });
  }

  /**
   * Send attendance alert to a parent.
   */
  async sendAttendanceAlert({ parentId, studentName, date, status, studentId }) {
    const parent = await this._getUserWithSchool(parentId);

    const message = `Attendance update for ${studentName} on ${date}: ${status}.`;
    const html = emailTemplates.attendanceAlert({
      recipientName: parent.full_name,
      studentName,
      date,
      status,
      schoolName: parent.school_name,
    });

    return this._createAndSend({
      userId: parentId,
      notificationType: "attendance_alert",
      message,
      referenceType: "student",
      referenceId: studentId,
      emailPayload: { to: parent.email, subject: "Attendance Alert", html, fromName: parent.school_name },
    });
  }

  /**
   * Broadcast an announcement to all users of a school (or a specific role).
   * Returns array of notification records.
   */
  async broadcastAnnouncement({ schoolId, title, message, targetRole, announcementId, sentBy }) {
    let query = `SELECT u.id, u.full_name, u.email, s.name as school_name
                 FROM users u
                 LEFT JOIN schools s ON u.school_id = s.id
                 WHERE u.school_id = $1 AND u.is_active = true`;
    const params = [schoolId];

    if (targetRole) {
      query += ` AND u.role = $2`;
      params.push(targetRole);
    }

    const usersResult = await pool.query(query, params);

    const results = await Promise.allSettled(
      usersResult.rows.map((user) => {
        const html = emailTemplates.announcement({
          recipientName: user.full_name,
          title,
          message,
          schoolName: user.school_name,
        });

        return this._createAndSend({
          userId: user.id,
          notificationType: "announcement",
          message,
          referenceType: "announcement",
          referenceId: announcementId,
          emailPayload: { to: user.email, subject: `Announcement: ${title}`, html, fromName: user.school_name },
        });
      }),
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    logger.info(`Announcement broadcast: ${sent} sent, ${failed} failed`, { schoolId, title });

    return { total: usersResult.rows.length, sent, failed };
  }

  /**
   * Send welcome email when a new user account is created.
   */
  async sendWelcomeEmail({ userId, tempPassword }) {
    const user = await this._getUserWithSchool(userId);

    const message = `Welcome to ${user.school_name}. Your account has been created.`;
    const html = emailTemplates.welcome({
      recipientName: user.full_name,
      email: user.email,
      tempPassword,
      role: user.role,
      schoolName: user.school_name,
    });

    return this._createAndSend({
      userId,
      notificationType: "welcome",
      message,
      emailPayload: { to: user.email, subject: `Welcome to ${user.school_name}`, html, fromName: user.school_name },
    });
  }

  // ─── Query methods ───────────────────────────────────────────────────────────

  /**
   * Get notifications for a user with optional filters.
   */
  async getUserNotifications(userId, { status, type, limit = 50, offset = 0 } = {}) {
    let query = `SELECT * FROM notifications WHERE user_id = $1`;
    const params = [userId];
    let idx = 2;

    if (status) { query += ` AND status = $${idx++}`; params.push(status); }
    if (type)   { query += ` AND notification_type = $${idx++}`; params.push(type); }

    query += ` ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get all notifications for a school (admin view).
   */
  async getSchoolNotifications(schoolId, { status, type, limit = 100, offset = 0 } = {}) {
    let query = `
      SELECT n.*, u.full_name as recipient_name, u.email as recipient_email
      FROM notifications n
      JOIN users u ON n.user_id = u.id
      WHERE u.school_id = $1`;
    const params = [schoolId];
    let idx = 2;

    if (status) { query += ` AND n.status = $${idx++}`; params.push(status); }
    if (type)   { query += ` AND n.notification_type = $${idx++}`; params.push(type); }

    query += ` ORDER BY n.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Retry all failed notifications for a school.
   */
  async retryFailed(schoolId) {
    const result = await pool.query(
      `SELECT n.*, u.email, u.full_name
       FROM notifications n
       JOIN users u ON n.user_id = u.id
       WHERE u.school_id = $1 AND n.status = 'failed' AND n.channel = 'email'`,
      [schoolId],
    );

    const retried = await Promise.allSettled(
      result.rows.map(async (n) => {
        const html = emailTemplates.generic({
          recipientName: n.full_name,
          subject: n.notification_type,
          message: n.message,
          schoolName: "",
        });

        await emailService.sendMail({ to: n.email, subject: n.notification_type, html, fromName: "" });
        await pool.query(
          `UPDATE notifications SET status = 'sent', sent_at = NOW() WHERE id = $1`,
          [n.id],
        );
      }),
    );

    return {
      total: result.rows.length,
      retried: retried.filter((r) => r.status === "fulfilled").length,
      failed: retried.filter((r) => r.status === "rejected").length,
    };
  }
}

module.exports = new NotificationsService();
