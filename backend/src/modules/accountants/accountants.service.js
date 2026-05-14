const bcrypt = require("bcryptjs");
const pool = require("../../database/connection");
const { ERROR_CODES, ERROR_MESSAGES, ROLES } = require("../../constants");
const AppError = require("../../utils/AppError");

class AccountantsService {
  async createAccountant(accountantData, schoolId) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Check if email already exists for this school
      const emailCheck = await client.query(
        "SELECT id FROM users WHERE school_id = $1 AND email = $2",
        [schoolId, accountantData.email],
      );

      if (emailCheck.rows.length > 0) {
        throw new AppError(
          ERROR_CODES.USER_ALREADY_EXISTS,
          "Accountant with this email already exists in this school",
          409,
        );
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(accountantData.password, 10);

      const query = `
        INSERT INTO users (
          school_id, role, email, password_hash, full_name, 
          phone, date_of_birth, gender, address, is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
        RETURNING id, email, full_name, role, phone, school_id, is_active, created_at
      `;

      const result = await client.query(query, [
        schoolId,
        ROLES.ACCOUNTANT,
        accountantData.email,
        hashedPassword,
        accountantData.fullName,
        accountantData.phone || null,
        accountantData.dateOfBirth || null,
        accountantData.gender || null,
        accountantData.address || null,
      ]);

      await client.query("COMMIT");
      return result.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async getAccountantsBySchool(schoolId) {
    const query = `
      SELECT id, email, full_name, phone, date_of_birth, gender, 
             address, is_active, created_at
      FROM users
      WHERE school_id = $1 AND role = $2
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query, [schoolId, ROLES.ACCOUNTANT]);
    return result.rows;
  }

  async getAccountantById(accountantId, schoolId) {
    const query = `
      SELECT id, email, full_name, phone, date_of_birth, gender, 
             address, is_active, created_at
      FROM users
      WHERE id = $1 AND school_id = $2 AND role = $3
    `;

    const result = await pool.query(query, [
      accountantId,
      schoolId,
      ROLES.ACCOUNTANT,
    ]);

    if (result.rows.length === 0) {
      throw new AppError(
        ERROR_CODES.USER_NOT_FOUND,
        "Accountant not found",
        404,
      );
    }

    return result.rows[0];
  }

  async updateAccountant(accountantId, updateData, schoolId) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updateData.fullName !== undefined) {
      fields.push(`full_name = $${paramCount++}`);
      values.push(updateData.fullName);
    }
    if (updateData.phone !== undefined) {
      fields.push(`phone = $${paramCount++}`);
      values.push(updateData.phone);
    }
    if (updateData.dateOfBirth !== undefined) {
      fields.push(`date_of_birth = $${paramCount++}`);
      values.push(updateData.dateOfBirth);
    }
    if (updateData.gender !== undefined) {
      fields.push(`gender = $${paramCount++}`);
      values.push(updateData.gender);
    }
    if (updateData.address !== undefined) {
      fields.push(`address = $${paramCount++}`);
      values.push(updateData.address);
    }
    if (updateData.isActive !== undefined) {
      fields.push(`is_active = $${paramCount++}`);
      values.push(updateData.isActive);
    }

    if (fields.length === 0) {
      throw new AppError(ERROR_CODES.INVALID_INPUT, "No fields to update", 400);
    }

    values.push(accountantId, schoolId, ROLES.ACCOUNTANT);
    const query = `
      UPDATE users 
      SET ${fields.join(", ")}
      WHERE id = $${paramCount++} AND school_id = $${paramCount++} AND role = $${paramCount}
      RETURNING id, email, full_name, phone, date_of_birth, gender, address, is_active
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new AppError(
        ERROR_CODES.USER_NOT_FOUND,
        "Accountant not found",
        404,
      );
    }

    return result.rows[0];
  }

  async deleteAccountant(accountantId, schoolId) {
    const query = `
      UPDATE users 
      SET is_active = false
      WHERE id = $1 AND school_id = $2 AND role = $3
      RETURNING id
    `;

    const result = await pool.query(query, [
      accountantId,
      schoolId,
      ROLES.ACCOUNTANT,
    ]);

    if (result.rows.length === 0) {
      throw new AppError(
        ERROR_CODES.USER_NOT_FOUND,
        "Accountant not found",
        404,
      );
    }

    return result.rows[0];
  }
}

module.exports = new AccountantsService();
