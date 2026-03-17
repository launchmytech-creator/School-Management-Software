const bcrypt = require("bcryptjs");
const pool = require("../../database/connection");
const { ERROR_CODES, ERROR_MESSAGES, ROLES } = require("../../constants");
const AppError = require("../../utils/AppError");

class TeachersService {
  async createTeacher(teacherData, schoolId) {
    const hashedPassword = await bcrypt.hash(teacherData.password, 10);

    const query = `
      INSERT INTO users (
        school_id, role, email, password_hash, full_name, 
        phone, date_of_birth, gender, address
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, email, full_name, role, phone, school_id, created_at
    `;

    const result = await pool.query(query, [
      schoolId,
      ROLES.TEACHER,
      teacherData.email,
      hashedPassword,
      teacherData.fullName,
      teacherData.phone || null,
      teacherData.dateOfBirth || null,
      teacherData.gender || null,
      teacherData.address || null,
    ]);

    return result.rows[0];
  }

  async getTeachersBySchool(schoolId) {
    const query = `
      SELECT id, email, full_name, phone, date_of_birth, gender, 
             address, is_active, created_at
      FROM users
      WHERE school_id = $1 AND role = $2
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query, [schoolId, ROLES.TEACHER]);
    return result.rows;
  }

  async getTeacherById(teacherId, schoolId) {
    const query = `
      SELECT id, email, full_name, phone, date_of_birth, gender, 
             address, is_active, created_at
      FROM users
      WHERE id = $1 AND school_id = $2 AND role = $3
    `;

    const result = await pool.query(query, [
      teacherId,
      schoolId,
      ROLES.TEACHER,
    ]);

    if (result.rows.length === 0) {
      throw new AppError(ERROR_CODES.USER_NOT_FOUND, "Teacher not found", 404);
    }

    return result.rows[0];
  }
}

module.exports = new TeachersService();
