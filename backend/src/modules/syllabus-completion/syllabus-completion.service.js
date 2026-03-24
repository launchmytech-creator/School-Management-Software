const pool = require("../../database/connection");
const { ERROR_CODES } = require("../../constants");
const AppError = require("../../utils/AppError");

class SyllabusCompletionService {
  async markCompletion(completionData, schoolId, userId) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const results = [];

      for (const record of completionData.chapters) {
        // Check if completion already exists
        const existingQuery = await client.query(
          "SELECT id FROM syllabus_completion WHERE class_subject_id = $1 AND chapter_id = $2",
          [completionData.classSubjectId, record.chapterId],
        );

        if (existingQuery.rows.length > 0) {
          // Update existing completion
          const updateQuery = `
            UPDATE syllabus_completion 
            SET status = $1, completed_date = $2, completed_by = $3
            WHERE class_subject_id = $4 AND chapter_id = $5
            RETURNING *
          `;
          const result = await client.query(updateQuery, [
            record.status,
            record.status === "completed"
              ? new Date().toISOString().split("T")[0]
              : null,
            userId,
            completionData.classSubjectId,
            record.chapterId,
          ]);
          results.push(result.rows[0]);
        } else {
          // Insert new completion
          const insertQuery = `
            INSERT INTO syllabus_completion (
              school_id, class_subject_id, chapter_id, status, 
              completed_date, completed_by
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
          `;
          const result = await client.query(insertQuery, [
            schoolId,
            completionData.classSubjectId,
            record.chapterId,
            record.status,
            record.status === "completed"
              ? new Date().toISOString().split("T")[0]
              : null,
            userId,
          ]);
          results.push(result.rows[0]);
        }
      }

      await client.query("COMMIT");
      return results;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async getCompletionBySchool(schoolId, filters = {}) {
    let query = `
      SELECT sc.*, 
             cs.id as class_subject_id,
             c.name as class_name, c.section as class_section,
             s.name as subject_name, s.code as subject_code,
             ch.name as chapter_name, ch.sequence_number,
             ay.year_name as academic_year_name,
             u.full_name as completed_by_name
      FROM syllabus_completion sc
      LEFT JOIN class_subjects cs ON sc.class_subject_id = cs.id
      LEFT JOIN classes c ON cs.class_id = c.id
      LEFT JOIN subjects s ON cs.subject_id = s.id
      LEFT JOIN chapters ch ON sc.chapter_id = ch.id
      LEFT JOIN academic_years ay ON cs.academic_year_id = ay.id
      LEFT JOIN users u ON sc.completed_by = u.id
      WHERE sc.school_id = $1
    `;

    const params = [schoolId];
    let paramCount = 2;

    if (filters.classId) {
      query += ` AND cs.class_id = $${paramCount++}`;
      params.push(filters.classId);
    }

    if (filters.subjectId) {
      query += ` AND cs.subject_id = $${paramCount++}`;
      params.push(filters.subjectId);
    }

    if (filters.classSubjectId) {
      query += ` AND sc.class_subject_id = $${paramCount++}`;
      params.push(filters.classSubjectId);
    }

    if (filters.status) {
      query += ` AND sc.status = $${paramCount++}`;
      params.push(filters.status);
    }

    if (filters.academicYearId) {
      query += ` AND cs.academic_year_id = $${paramCount++}`;
      params.push(filters.academicYearId);
    }

    query += ` ORDER BY c.name, s.name, ch.sequence_number`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getClassSubjectProgress(classSubjectId, schoolId) {
    const query = `
      SELECT 
        COUNT(*) as total_chapters,
        COUNT(*) FILTER (WHERE sc.status = 'completed') as completed_chapters,
        COUNT(*) FILTER (WHERE sc.status = 'in_progress') as in_progress_chapters,
        COUNT(*) FILTER (WHERE sc.status = 'pending' OR sc.status IS NULL) as pending_chapters,
        ROUND(
          (COUNT(*) FILTER (WHERE sc.status = 'completed')::DECIMAL / 
          NULLIF(COUNT(*)::DECIMAL, 0)) * 100, 
          2
        ) as completion_percentage
      FROM chapters ch
      LEFT JOIN class_subjects cs ON cs.subject_id = ch.subject_id
      LEFT JOIN syllabus_completion sc ON sc.chapter_id = ch.id AND sc.class_subject_id = cs.id
      WHERE cs.id = $1 AND cs.school_id = $2
    `;

    const result = await pool.query(query, [classSubjectId, schoolId]);
    return result.rows[0];
  }

  async getSubjectChapters(classSubjectId, schoolId) {
    const query = `
      SELECT ch.*, 
             sc.status, sc.completed_date, sc.completed_by,
             u.full_name as completed_by_name
      FROM chapters ch
      LEFT JOIN class_subjects cs ON cs.subject_id = ch.subject_id
      LEFT JOIN syllabus_completion sc ON sc.chapter_id = ch.id AND sc.class_subject_id = cs.id
      LEFT JOIN users u ON sc.completed_by = u.id
      WHERE cs.id = $1 AND cs.school_id = $2
      ORDER BY ch.sequence_number, ch.name
    `;

    const result = await pool.query(query, [classSubjectId, schoolId]);
    return result.rows;
  }

  async deleteCompletion(completionId, schoolId) {
    const query = `
      DELETE FROM syllabus_completion 
      WHERE id = $1 AND school_id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [completionId, schoolId]);

    if (result.rows.length === 0) {
      throw new AppError(
        ERROR_CODES.NOT_FOUND,
        "Syllabus completion record not found",
        404,
      );
    }

    return result.rows[0];
  }
}

module.exports = new SyllabusCompletionService();
