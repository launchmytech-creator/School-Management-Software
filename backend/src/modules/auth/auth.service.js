const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../../database/connection");
const config = require("../../config");
const { ERROR_CODES, ERROR_MESSAGES, ROLES } = require("../../constants");
const AppError = require("../../utils/AppError");
const emailService = require("../../utils/emailService");
const emailTemplates = require("../../utils/emailTemplates");
const logger = require("../../utils/logger");

class AuthService {
  async login(email, password) {
    const query = `
      SELECT u.*, s.name as school_name, s.is_active as school_active, 
             s.subscription_status, s.subscription_plan_id,
             s.subscription_end_date, s.fee_terms,
             sp.name as subscription_plan_name, sp.features as subscription_features
      FROM users u
      LEFT JOIN schools s ON u.school_id = s.id
      LEFT JOIN subscription_plans sp ON s.subscription_plan_id = sp.id
      WHERE u.email = $1 AND u.is_active = true
    `;

    const result = await pool.query(query, [email]);

    if (result.rows.length === 0) {
      throw new AppError(
        ERROR_CODES.AUTH_INVALID_CREDENTIALS,
        ERROR_MESSAGES[ERROR_CODES.AUTH_INVALID_CREDENTIALS],
        401,
      );
    }

    const user = result.rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new AppError(
        ERROR_CODES.AUTH_INVALID_CREDENTIALS,
        ERROR_MESSAGES[ERROR_CODES.AUTH_INVALID_CREDENTIALS],
        401,
      );
    }

    // Check school status for non-super-admin users
    if (user.role !== ROLES.SUPER_ADMIN) {
      if (!user.school_active) {
        throw new AppError(
          ERROR_CODES.SCHOOL_INACTIVE,
          ERROR_MESSAGES[ERROR_CODES.SCHOOL_INACTIVE],
          403,
        );
      }

      if (user.subscription_status === "expired") {
        throw new AppError(
          ERROR_CODES.SCHOOL_SUBSCRIPTION_EXPIRED,
          ERROR_MESSAGES[ERROR_CODES.SCHOOL_SUBSCRIPTION_EXPIRED],
          403,
        );
      }

      if (user.subscription_status === "suspended") {
        throw new AppError(
          ERROR_CODES.SCHOOL_SUBSCRIPTION_SUSPENDED,
          ERROR_MESSAGES[ERROR_CODES.SCHOOL_SUBSCRIPTION_SUSPENDED],
          403,
        );
      }

      if (user.subscription_status === "trial" && user.subscription_end_date) {
        const trialEnd = new Date(user.subscription_end_date);
        if (trialEnd < new Date()) {
          throw new AppError(
            ERROR_CODES.SCHOOL_SUBSCRIPTION_TRIAL_EXPIRED,
            ERROR_MESSAGES[ERROR_CODES.SCHOOL_SUBSCRIPTION_TRIAL_EXPIRED],
            403,
          );
        }
      }
    }

    // Generate JWT token
      const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        schoolId: user.school_id,
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn },
    );

    // Remove sensitive data
    delete user.password_hash;

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        schoolId: user.school_id,
        schoolName: user.school_name,
        subscriptionPlanId: user.subscription_plan_id,
        subscriptionPlan: user.subscription_plan_name,
        subscriptionFeatures: user.subscription_features,
        subscriptionStatus: user.subscription_status,
        subscriptionEndDate: user.subscription_end_date,
        feeTerms: user.fee_terms,
      },
    };
  }

  // [UPDATED] Include subscription_status in query and response
  async getProfile(userId) {
      const query = `
      SELECT u.id, u.email, u.full_name, u.role, u.phone,
             u.date_of_birth, u.gender, u.address, u.school_id,
             s.name as school_name, s.subscription_plan_id, s.subscription_status,
             s.subscription_end_date, s.fee_terms,
             sp.name as subscription_plan_name, sp.features as subscription_features
      FROM users u
      LEFT JOIN schools s ON u.school_id = s.id
      LEFT JOIN subscription_plans sp ON s.subscription_plan_id = sp.id
      WHERE u.id = $1 AND u.is_active = true
    `;

    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      throw new AppError(
        ERROR_CODES.USER_NOT_FOUND,
        ERROR_MESSAGES[ERROR_CODES.USER_NOT_FOUND],
        404,
      );
    }

    const profile = result.rows[0];
    return {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      role: profile.role,
      phone: profile.phone,
      date_of_birth: profile.date_of_birth,
      gender: profile.gender,
      address: profile.address,
      school_id: profile.school_id,
      school_name: profile.school_name,
      subscription_plan_id: profile.subscription_plan_id,
      subscription_plan_name: profile.subscription_plan_name,
      subscription_features: profile.subscription_features,
      subscription_status: profile.subscription_status,
      subscription_end_date: profile.subscription_end_date,
      fee_terms: profile.fee_terms,
    };
  }

  // [NEW] Update user profile
  async updateProfile(userId, data) {
    const { fullName, phone, password, currentPassword } = data;

    // Get current user
    const userResult = await pool.query(
      "SELECT password_hash FROM users WHERE id = $1 AND is_active = true",
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new AppError(
        ERROR_CODES.USER_NOT_FOUND,
        ERROR_MESSAGES[ERROR_CODES.USER_NOT_FOUND],
        404,
      );
    }

    // If changing password, verify current password
    if (password) {
      if (!currentPassword) {
        throw new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          "Current password is required to change password",
          400,
        );
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
      if (!isPasswordValid) {
        throw new AppError(
          ERROR_CODES.AUTH_INVALID_CREDENTIALS,
          "Current password is incorrect",
          400,
        );
      }
    }

    // Build update query
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (fullName !== undefined) {
      fields.push(`full_name = $${paramCount++}`);
      values.push(fullName);
    }
    if (phone !== undefined) {
      fields.push(`phone = $${paramCount++}`);
      values.push(phone);
    }
    if (password !== undefined) {
      const hashedPassword = await bcrypt.hash(password, 10);
      fields.push(`password_hash = $${paramCount++}`);
      values.push(hashedPassword);
    }

    if (fields.length === 0) {
      throw new AppError(
        ERROR_CODES.INVALID_INPUT,
        "No fields to update",
        400,
      );
    }

    values.push(userId);
    const query = `
      UPDATE users
      SET ${fields.join(", ")}
      WHERE id = $${paramCount}
      RETURNING id, email, full_name, phone, role, school_id
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new AppError(
        ERROR_CODES.USER_NOT_FOUND,
        ERROR_MESSAGES[ERROR_CODES.USER_NOT_FOUND],
        404,
      );
    }

    return result.rows[0];
  }

  async forgotPassword(email) {
    const result = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.school_id, s.name as school_name
       FROM users u
       LEFT JOIN schools s ON u.school_id = s.id
       WHERE u.email = $1 AND u.is_active = true`,
      [email],
    );

    if (result.rows.length === 0) {
      return { message: "If an account exists, a reset link has been sent" };
    }

    const user = result.rows[0];
    const resetToken = jwt.sign(
      { userId: user.id, type: "password_reset" },
      config.jwt.secret,
      { expiresIn: config.jwt.resetTokenExpiresIn },
    );

    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${resetToken}`;
    const html = emailTemplates.passwordReset({
      recipientName: user.full_name,
      resetUrl,
      schoolName: user.school_name || "School Management System",
    });

    try {
      await emailService.sendMail({
        to: user.email,
        subject: "Password Reset Request",
        html,
      });
    } catch (error) {
      logger.error("Failed to send password reset email", {
        error: error.message,
        email: user.email,
      });
    }

    return { message: "If an account exists, a reset link has been sent" };
  }

  async resetPassword(token, newPassword) {
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        throw new AppError(
          ERROR_CODES.AUTH_RESET_TOKEN_EXPIRED,
          ERROR_MESSAGES[ERROR_CODES.AUTH_RESET_TOKEN_EXPIRED],
          400,
        );
      }
      throw new AppError(
        ERROR_CODES.AUTH_RESET_TOKEN_INVALID,
        ERROR_MESSAGES[ERROR_CODES.AUTH_RESET_TOKEN_INVALID],
        400,
      );
    }

    if (decoded.type !== "password_reset") {
      throw new AppError(
        ERROR_CODES.AUTH_RESET_TOKEN_INVALID,
        ERROR_MESSAGES[ERROR_CODES.AUTH_RESET_TOKEN_INVALID],
        400,
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updateResult = await pool.query(
      "UPDATE users SET password_hash = $1 WHERE id = $2 AND is_active = true RETURNING id, email",
      [hashedPassword, decoded.userId],
    );

    if (updateResult.rows.length === 0) {
      throw new AppError(
        ERROR_CODES.USER_NOT_FOUND,
        ERROR_MESSAGES[ERROR_CODES.USER_NOT_FOUND],
        404,
      );
    }

    return { message: "Password reset successful" };
  }
}

module.exports = new AuthService();
