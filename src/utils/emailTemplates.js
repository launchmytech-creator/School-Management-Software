/**
 * Centralized email HTML templates.
 * All templates share a consistent branded layout.
 */

const baseLayout = (title, bodyContent, schoolName = "School Management System") => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
  <style>
    body { margin:0; padding:0; background:#f4f6f9; font-family: Arial, sans-serif; }
    .wrapper { max-width:600px; margin:30px auto; background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.08); }
    .header { background:#1a73e8; padding:24px 32px; }
    .header h1 { margin:0; color:#ffffff; font-size:20px; }
    .body { padding:32px; color:#333333; font-size:15px; line-height:1.6; }
    .footer { background:#f4f6f9; padding:16px 32px; text-align:center; font-size:12px; color:#888888; }
    .btn { display:inline-block; margin-top:20px; padding:12px 24px; background:#1a73e8; color:#ffffff; text-decoration:none; border-radius:4px; font-size:14px; }
    .divider { border:none; border-top:1px solid #eeeeee; margin:20px 0; }
    .highlight { background:#f0f7ff; border-left:4px solid #1a73e8; padding:12px 16px; border-radius:0 4px 4px 0; margin:16px 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header"><h1>${schoolName}</h1></div>
    <div class="body">${bodyContent}</div>
    <div class="footer">This is an automated message. Please do not reply to this email.</div>
  </div>
</body>
</html>`;

const templates = {
  /**
   * Generic notification email
   */
  generic({ recipientName, subject, message, schoolName }) {
    const body = `
      <p>Dear <strong>${recipientName}</strong>,</p>
      <div class="highlight">${message}</div>
      <hr class="divider"/>
      <p style="font-size:13px;color:#888">Sent by ${schoolName || "School Management System"}</p>`;
    return baseLayout(subject, body, schoolName);
  },

  /**
   * Fee payment reminder
   */
  feeReminder({ recipientName, studentName, amountDue, dueDate, schoolName }) {
    const body = `
      <p>Dear <strong>${recipientName}</strong>,</p>
      <p>This is a reminder that a fee payment is due for <strong>${studentName}</strong>.</p>
      <div class="highlight">
        <strong>Amount Due:</strong> ${amountDue}<br/>
        <strong>Due Date:</strong> ${dueDate}
      </div>
      <p>Please ensure timely payment to avoid any inconvenience.</p>`;
    return baseLayout("Fee Payment Reminder", body, schoolName);
  },

  /**
   * Exam result notification
   */
  examResult({ recipientName, studentName, examName, grade, marks, totalMarks, schoolName }) {
    const body = `
      <p>Dear <strong>${recipientName}</strong>,</p>
      <p>The results for <strong>${studentName}</strong> are now available.</p>
      <div class="highlight">
        <strong>Exam:</strong> ${examName}<br/>
        <strong>Marks:</strong> ${marks} / ${totalMarks}<br/>
        <strong>Grade:</strong> ${grade}
      </div>
      <p>Please log in to the portal for the detailed report card.</p>`;
    return baseLayout("Exam Results Available", body, schoolName);
  },

  /**
   * Attendance alert
   */
  attendanceAlert({ recipientName, studentName, date, status, schoolName }) {
    const body = `
      <p>Dear <strong>${recipientName}</strong>,</p>
      <p>Attendance update for <strong>${studentName}</strong>:</p>
      <div class="highlight">
        <strong>Date:</strong> ${date}<br/>
        <strong>Status:</strong> <span style="color:${status === 'absent' ? '#d93025' : '#188038'}">${status.toUpperCase()}</span>
      </div>
      <p>If you have any questions, please contact the school administration.</p>`;
    return baseLayout("Attendance Alert", body, schoolName);
  },

  /**
   * Announcement broadcast
   */
  announcement({ recipientName, title, message, schoolName }) {
    const body = `
      <p>Dear <strong>${recipientName}</strong>,</p>
      <p><strong>${title}</strong></p>
      <div class="highlight">${message}</div>`;
    return baseLayout(`Announcement: ${title}`, body, schoolName);
  },

  /**
   * Welcome / account created
   */
  welcome({ recipientName, email, tempPassword, role, schoolName }) {
    const body = `
      <p>Dear <strong>${recipientName}</strong>,</p>
      <p>Your account has been created on <strong>${schoolName}</strong>.</p>
      <div class="highlight">
        <strong>Email:</strong> ${email}<br/>
        <strong>Temporary Password:</strong> ${tempPassword}<br/>
        <strong>Role:</strong> ${role}
      </div>
      <p>Please log in and change your password immediately.</p>`;
    return baseLayout("Welcome to " + schoolName, body, schoolName);
  },
};

module.exports = templates;
