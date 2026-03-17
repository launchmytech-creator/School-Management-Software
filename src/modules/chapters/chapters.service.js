const pool = require("../../database/connection");
const { ERROR_CODES } = require("../../constants");
const AppError = require("../../utils/AppError");

class ChaptersService {
  async createChapter(chapterData, schoolId) {
    const query = `
      INSERT INTO chapters (school_id, subject_id, name, sequence_number)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await pool.query(query, [
      schoolId,
      chapterData.subjectId,
      chapterData.name,
      chapterData.sequenceNumber || null,
    ]);

    return result.rows[0];
  }

  async getChaptersBySubject(subjectId, schoolId) {
    const query = `
      SELECT c.*, s.name as subject_name, s.code as subject_code
      FROM chapters c
      LEFT JOIN subjects s ON c.subject_id = s.id
      WHERE c.subject_id = $1 AND c.school_id = $2
      ORDER BY c.sequence_number, c.name
    `;

    const result = await pool.query(query, [subjectId, schoolId]);
    return result.rows;
  }

  async getChapterById(chapterId, schoolId) {
    const query = `
      SELECT c.*, s.name as subject_name, s.code as subject_code
      FROM chapters c
      LEFT JOIN subjects s ON c.subject_id = s.id
      WHERE c.id = $1 AND c.school_id = $2
    `;

    const result = await pool.query(query, [chapterId, schoolId]);

    if (result.rows.length === 0) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Chapter not found", 404);
    }

    return result.rows[0];
  }

  async updateChapter(chapterId, updateData, schoolId) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updateData.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(updateData.name);
    }
    if (updateData.sequenceNumber !== undefined) {
      fields.push(`sequence_number = $${paramCount++}`);
      values.push(updateData.sequenceNumber);
    }

    if (fields.length === 0) {
      throw new AppError(ERROR_CODES.INVALID_INPUT, "No fields to update", 400);
    }

    values.push(chapterId, schoolId);
    const query = `
      UPDATE chapters 
      SET ${fields.join(", ")}
      WHERE id = $${paramCount++} AND school_id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Chapter not found", 404);
    }

    return result.rows[0];
  }

  async deleteChapter(chapterId, schoolId) {
    const query = `
      DELETE FROM chapters 
      WHERE id = $1 AND school_id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [chapterId, schoolId]);

    if (result.rows.length === 0) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Chapter not found", 404);
    }

    return result.rows[0];
  }
}

module.exports = new ChaptersService();
