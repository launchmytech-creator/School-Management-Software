const pool = require("../../database/connection");
const { ERROR_CODES, ERROR_MESSAGES } = require("../../constants");
const AppError = require("../../utils/AppError");

class StudentsService {
  async createStudent(studentData, schoolId) {
    const query = `
      INSERT INTO students (
        school_id, admission_number, full_name, date_of_birth, 
        gender, address, phone, admission_date, current_class_id, 
        parent_id, roll_number, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const result = await pool.query(query, [
      schoolId,
      studentData.admissionNumber,
      studentData.fullName,
      studentData.dateOfBirth || null,
      studentData.gender || null,
      studentData.address || null,
      studentData.phone || null,
      studentData.admissionDate,
      studentData.currentClassId || null,
      studentData.parentId || null,
      studentData.rollNumber || null,
      studentData.status || "active",
    ]);

    return result.rows[0];
  }

  async getStudentsBySchool(schoolId, filters = {}) {
    let query = `
      SELECT s.*, c.name as class_name, c.section as class_section,
             u.full_name as parent_name, u.phone as parent_phone
      FROM students s
      LEFT JOIN classes c ON s.current_class_id = c.id
      LEFT JOIN users u ON s.parent_id = u.id
      WHERE s.school_id = $1
    `;

    const params = [schoolId];
    let paramCount = 2;

    if (filters.classId) {
      query += ` AND s.current_class_id = $${paramCount++}`;
      params.push(filters.classId);
    }

    if (filters.status) {
      query += ` AND s.status = $${paramCount++}`;
      params.push(filters.status);
    }

    query += ` ORDER BY s.full_name`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getStudentById(studentId, schoolId) {
    const query = `
      SELECT s.*, c.name as class_name, c.section as class_section,
             u.full_name as parent_name, u.email as parent_email, u.phone as parent_phone
      FROM students s
      LEFT JOIN classes c ON s.current_class_id = c.id
      LEFT JOIN users u ON s.parent_id = u.id
      WHERE s.id = $1 AND s.school_id = $2
    `;

    const result = await pool.query(query, [studentId, schoolId]);

    if (result.rows.length === 0) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Student not found", 404);
    }

    return result.rows[0];
  }

  async updateStudent(studentId, updateData, schoolId) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updateData.fullName !== undefined) {
      fields.push(`full_name = $${paramCount++}`);
      values.push(updateData.fullName);
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
    if (updateData.phone !== undefined) {
      fields.push(`phone = $${paramCount++}`);
      values.push(updateData.phone);
    }
    if (updateData.currentClassId !== undefined) {
      fields.push(`current_class_id = $${paramCount++}`);
      values.push(updateData.currentClassId);
    }
    if (updateData.parentId !== undefined) {
      fields.push(`parent_id = $${paramCount++}`);
      values.push(updateData.parentId);
    }
    if (updateData.rollNumber !== undefined) {
      fields.push(`roll_number = $${paramCount++}`);
      values.push(updateData.rollNumber);
    }
    if (updateData.status !== undefined) {
      fields.push(`status = $${paramCount++}`);
      values.push(updateData.status);
    }

    if (fields.length === 0) {
      throw new AppError(ERROR_CODES.INVALID_INPUT, "No fields to update", 400);
    }

    values.push(studentId, schoolId);
    const query = `
      UPDATE students 
      SET ${fields.join(", ")}
      WHERE id = $${paramCount++} AND school_id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Student not found", 404);
    }

    return result.rows[0];
  }

  async deleteStudent(studentId, schoolId) {
    const query = `
      UPDATE students 
      SET status = 'inactive'
      WHERE id = $1 AND school_id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [studentId, schoolId]);

    if (result.rows.length === 0) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Student not found", 404);
    }

    return result.rows[0];
  }
}

module.exports = new StudentsService();
