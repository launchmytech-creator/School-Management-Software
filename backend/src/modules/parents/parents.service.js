const pool = require("../../database/connection");
const { ERROR_CODES } = require("../../constants");
const AppError = require("../../utils/AppError");
const bcrypt = require("bcryptjs");

class ParentsService {
  async createParent(parentData, schoolId) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Check if email already exists for this school
      const emailCheck = await client.query(
        "SELECT id FROM users WHERE school_id = $1 AND email = $2",
        [schoolId, parentData.email],
      );

      if (emailCheck.rows.length > 0) {
        throw new AppError(
          ERROR_CODES.USER_ALREADY_EXISTS,
          "Parent with this email already exists in this school",
          409,
        );
      }

      // Hash password
      const passwordHash = await bcrypt.hash(parentData.password, 10);

      // Create parent user
      const query = `
        INSERT INTO users (
          school_id, role, email, password_hash, full_name, 
          phone, date_of_birth, gender, address, is_active
        )
        VALUES ($1, 'parent', $2, $3, $4, $5, $6, $7, $8, true)
        RETURNING id, school_id, role, email, full_name, phone, 
                  date_of_birth, gender, address, is_active, created_at
      `;

      const result = await client.query(query, [
        schoolId,
        parentData.email,
        passwordHash,
        parentData.fullName,
        parentData.phone || null,
        parentData.dateOfBirth || null,
        parentData.gender || null,
        parentData.address || null,
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

  async getParentsBySchool(schoolId) {
    const query = `
      SELECT u.id, u.email, u.full_name, u.phone, u.date_of_birth, 
             u.gender, u.address, u.is_active, u.created_at,
             COUNT(s.id) as children_count
      FROM users u
      LEFT JOIN students s ON s.parent_id = u.id
      WHERE u.school_id = $1 AND u.role = 'parent'
      GROUP BY u.id
      ORDER BY u.full_name
    `;

    const result = await pool.query(query, [schoolId]);
    return result.rows;
  }

  async getParentById(parentId, schoolId) {
    const query = `
      SELECT u.id, u.email, u.full_name, u.phone, u.date_of_birth, 
             u.gender, u.address, u.is_active, u.created_at
      FROM users u
      WHERE u.id = $1 AND u.school_id = $2 AND u.role = 'parent'
    `;

    const result = await pool.query(query, [parentId, schoolId]);

    if (result.rows.length === 0) {
      throw new AppError(ERROR_CODES.USER_NOT_FOUND, "Parent not found", 404);
    }

    return result.rows[0];
  }

  async updateParent(parentId, updateData, schoolId) {
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

    if (fields.length === 0) {
      throw new AppError(ERROR_CODES.INVALID_INPUT, "No fields to update", 400);
    }

    values.push(parentId, schoolId);
    const query = `
      UPDATE users 
      SET ${fields.join(", ")}
      WHERE id = $${paramCount++} AND school_id = $${paramCount} AND role = 'parent'
      RETURNING id, email, full_name, phone, date_of_birth, gender, address, is_active
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new AppError(ERROR_CODES.USER_NOT_FOUND, "Parent not found", 404);
    }

    return result.rows[0];
  }

  async deleteParent(parentId, schoolId) {
    // Check if parent has linked students
    const studentCheck = await pool.query(
      "SELECT COUNT(*) as count FROM students WHERE parent_id = $1 AND school_id = $2",
      [parentId, schoolId],
    );

    if (parseInt(studentCheck.rows[0].count) > 0) {
      throw new AppError(
        ERROR_CODES.INVALID_INPUT,
        "Cannot delete parent with linked students. Please unlink students first.",
        400,
      );
    }

    const query = `
      UPDATE users 
      SET is_active = false
      WHERE id = $1 AND school_id = $2 AND role = 'parent'
      RETURNING id
    `;

    const result = await pool.query(query, [parentId, schoolId]);

    if (result.rows.length === 0) {
      throw new AppError(ERROR_CODES.USER_NOT_FOUND, "Parent not found", 404);
    }

    return result.rows[0];
  }

  async linkStudentToParent(parentId, studentId, schoolId) {
    // Verify parent exists
    await this.getParentById(parentId, schoolId);

    // Update student's parent_id
    const query = `
      UPDATE students 
      SET parent_id = $1
      WHERE id = $2 AND school_id = $3
      RETURNING id, full_name, parent_id
    `;

    const result = await pool.query(query, [parentId, studentId, schoolId]);

    if (result.rows.length === 0) {
      throw new AppError(
        ERROR_CODES.RESOURCE_NOT_FOUND,
        "Student not found",
        404,
      );
    }

    return result.rows[0];
  }

  async unlinkStudentFromParent(studentId, schoolId) {
    const query = `
      UPDATE students 
      SET parent_id = NULL
      WHERE id = $1 AND school_id = $2
      RETURNING id, full_name, parent_id
    `;

    const result = await pool.query(query, [studentId, schoolId]);

    if (result.rows.length === 0) {
      throw new AppError(
        ERROR_CODES.RESOURCE_NOT_FOUND,
        "Student not found",
        404,
      );
    }

    return result.rows[0];
  }

  async getParentChildren(parentId, schoolId) {
    // Verify parent exists
    await this.getParentById(parentId, schoolId);

    const query = `
      SELECT s.id, s.admission_number, s.full_name, s.date_of_birth, 
             s.gender, s.roll_number, s.status,
             c.name as class_name, c.section as class_section
      FROM students s
      LEFT JOIN classes c ON s.current_class_id = c.id
      WHERE s.parent_id = $1 AND s.school_id = $2
      ORDER BY s.full_name
    `;

    const result = await pool.query(query, [parentId, schoolId]);
    return result.rows;
  }

  async verifyParentOwnsStudent(parentId, studentId, schoolId) {
    const result = await pool.query(
      `SELECT id FROM students WHERE id = $1 AND parent_id = $2 AND school_id = $3`,
      [studentId, parentId, schoolId],
    );

    if (result.rows.length === 0) {
      throw new AppError(
        ERROR_CODES.AUTH_UNAUTHORIZED,
        "You can only access data for your own children",
        403,
      );
    }
  }
}

module.exports = new ParentsService();
