const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../../database/connection");
const config = require("../../config");
const { ERROR_CODES, ERROR_MESSAGES, ROLES } = require("../../constants");
const AppError = require("../../utils/AppError");

class AuthService {
  async login(email, password) {
    const query = `
      SELECT u.*, s.name as school_name, s.is_active as school_active, 
             s.subscription_status
      FROM users u
      LEFT JOIN schools s ON u.school_id = s.id
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
      },
    };
  }

  async getProfile(userId) {
    const query = `
      SELECT u.id, u.email, u.full_name, u.role, u.phone,
             u.date_of_birth, u.gender, u.address, u.school_id,
             s.name as school_name
      FROM users u
      LEFT JOIN schools s ON u.school_id = s.id
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

    return result.rows[0];
  }
}

module.exports = new AuthService();
