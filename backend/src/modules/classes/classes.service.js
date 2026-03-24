const pool = require("../../database/connection");
const { ERROR_CODES, ERROR_MESSAGES } = require("../../constants");
const AppError = require("../../utils/AppError");

class ClassesService {
  async createClass(classData, schoolId) {
    const query = `
      INSERT INTO classes (
        school_id, name, section, academic_year_id, default_fee_amount
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await pool.query(query, [
      schoolId,
      classData.name,
      classData.section || null,
      classData.academicYearId,
      classData.defaultFeeAmount || null,
    ]);

    return result.rows[0];
  }

  async getClassesBySchool(schoolId, academicYearId = null) {
    let query = `
      SELECT c.*, ay.year_name, ay.start_date, ay.end_date,
             COUNT(DISTINCT s.id) as student_count
      FROM classes c
      LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
      LEFT JOIN students s ON c.id = s.current_class_id AND s.status = 'active'
      WHERE c.school_id = $1
    `;

    const params = [schoolId];

    if (academicYearId) {
      query += ` AND c.academic_year_id = $2`;
      params.push(academicYearId);
    }

    query += ` GROUP BY c.id, ay.year_name, ay.start_date, ay.end_date ORDER BY c.name, c.section`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getClassById(classId, schoolId) {
    const query = `
      SELECT c.*, ay.year_name, ay.start_date, ay.end_date,
             COUNT(DISTINCT s.id) as student_count
      FROM classes c
      LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
      LEFT JOIN students s ON c.id = s.current_class_id AND s.status = 'active'
      WHERE c.id = $1 AND c.school_id = $2
      GROUP BY c.id, ay.year_name, ay.start_date, ay.end_date
    `;

    const result = await pool.query(query, [classId, schoolId]);

    if (result.rows.length === 0) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Class not found", 404);
    }

    return result.rows[0];
  }

  async updateClass(classId, updateData, schoolId) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updateData.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(updateData.name);
    }
    if (updateData.section !== undefined) {
      fields.push(`section = $${paramCount++}`);
      values.push(updateData.section);
    }
    if (updateData.defaultFeeAmount !== undefined) {
      fields.push(`default_fee_amount = $${paramCount++}`);
      values.push(updateData.defaultFeeAmount);
    }

    if (fields.length === 0) {
      throw new AppError(ERROR_CODES.INVALID_INPUT, "No fields to update", 400);
    }

    values.push(classId, schoolId);
    const query = `
      UPDATE classes 
      SET ${fields.join(", ")}
      WHERE id = $${paramCount++} AND school_id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Class not found", 404);
    }

    return result.rows[0];
  }

  async deleteClass(classId, schoolId) {
    const query = `
      DELETE FROM classes 
      WHERE id = $1 AND school_id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [classId, schoolId]);

    if (result.rows.length === 0) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Class not found", 404);
    }

    return result.rows[0];
  }
}

module.exports = new ClassesService();
