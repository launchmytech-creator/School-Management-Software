const pool = require("../../database/connection");
const { ERROR_CODES } = require("../../constants");
const AppError = require("../../utils/AppError");

class SubjectsService {
  async createSubject(subjectData, schoolId) {
    const existing = await pool.query(
      'SELECT id, name FROM subjects WHERE school_id = $1 AND code = $2',
      [schoolId, subjectData.code]
    );
    
    if (existing.rows.length > 0) {
      throw new AppError(
        ERROR_CODES.SUBJECT_ALREADY_EXISTS,
        `Subject with code "${subjectData.code}" already exists. Use existing subject "${existing.rows[0].name}" or choose a different code.`,
        409
      );
    }

    const query = `
      INSERT INTO subjects (school_id, name, code)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const result = await pool.query(query, [
      schoolId,
      subjectData.name,
      subjectData.code,
    ]);

    return result.rows[0];
  }

  async getSubjectsBySchool(schoolId) {
    const query = `
      SELECT s.*, COUNT(DISTINCT c.id) as chapter_count
      FROM subjects s
      LEFT JOIN chapters c ON s.id = c.subject_id
      WHERE s.school_id = $1
      GROUP BY s.id
      ORDER BY s.name
    `;

    const result = await pool.query(query, [schoolId]);
    return result.rows;
  }

  async getSubjectById(subjectId, schoolId) {
    const query = `
      SELECT s.*, COUNT(DISTINCT c.id) as chapter_count
      FROM subjects s
      LEFT JOIN chapters c ON s.id = c.subject_id
      WHERE s.id = $1 AND s.school_id = $2
      GROUP BY s.id
    `;

    const result = await pool.query(query, [subjectId, schoolId]);

    if (result.rows.length === 0) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Subject not found", 404);
    }

    return result.rows[0];
  }

  async updateSubject(subjectId, updateData, schoolId) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updateData.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(updateData.name);
    }
    if (updateData.code !== undefined) {
      fields.push(`code = $${paramCount++}`);
      values.push(updateData.code);
    }

    if (fields.length === 0) {
      throw new AppError(ERROR_CODES.INVALID_INPUT, "No fields to update", 400);
    }

    values.push(subjectId, schoolId);
    const query = `
      UPDATE subjects 
      SET ${fields.join(", ")}
      WHERE id = $${paramCount++} AND school_id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Subject not found", 404);
    }

    return result.rows[0];
  }

  async deleteSubject(subjectId, schoolId) {
    const query = `
      DELETE FROM subjects 
      WHERE id = $1 AND school_id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [subjectId, schoolId]);

    if (result.rows.length === 0) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Subject not found", 404);
    }

    return result.rows[0];
  }
}

module.exports = new SubjectsService();
