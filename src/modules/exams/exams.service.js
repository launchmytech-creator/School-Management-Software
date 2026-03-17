const pool = require("../../database/connection");
const { ERROR_CODES } = require("../../constants");
const AppError = require("../../utils/AppError");

class ExamsService {
  async createExam(examData, schoolId) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Create exam
      const examQuery = `
        INSERT INTO exams (
          school_id, class_id, academic_year_id, name, exam_type, 
          start_date, end_date, weightage
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const examResult = await client.query(examQuery, [
        schoolId,
        examData.classId,
        examData.academicYearId,
        examData.name,
        examData.examType || null,
        examData.startDate,
        examData.endDate,
        examData.weightage || null,
      ]);

      const exam = examResult.rows[0];

      // Create exam subjects if provided
      if (examData.subjects && examData.subjects.length > 0) {
        for (const subject of examData.subjects) {
          const subjectQuery = `
            INSERT INTO exam_subjects (
              school_id, exam_id, subject_id, max_marks, exam_date
            )
            VALUES ($1, $2, $3, $4, $5)
          `;

          await client.query(subjectQuery, [
            schoolId,
            exam.id,
            subject.subjectId,
            subject.maxMarks,
            subject.examDate || null,
          ]);
        }
      }

      await client.query("COMMIT");
      return exam;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async getExamsBySchool(schoolId, filters = {}) {
    let query = `
      SELECT e.*, 
             c.name as class_name, c.section as class_section,
             ay.year_name as academic_year_name,
             COUNT(es.id) as subject_count
      FROM exams e
      LEFT JOIN classes c ON e.class_id = c.id
      LEFT JOIN academic_years ay ON e.academic_year_id = ay.id
      LEFT JOIN exam_subjects es ON e.id = es.exam_id
      WHERE e.school_id = $1
    `;

    const params = [schoolId];
    let paramCount = 2;

    if (filters.classId) {
      query += ` AND e.class_id = $${paramCount++}`;
      params.push(filters.classId);
    }

    if (filters.academicYearId) {
      query += ` AND e.academic_year_id = $${paramCount++}`;
      params.push(filters.academicYearId);
    }

    if (filters.examType) {
      query += ` AND e.exam_type = $${paramCount++}`;
      params.push(filters.examType);
    }

    query += ` GROUP BY e.id, c.name, c.section, ay.year_name ORDER BY e.start_date DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getExamById(examId, schoolId) {
    const query = `
      SELECT e.*, 
             c.name as class_name, c.section as class_section,
             ay.year_name as academic_year_name
      FROM exams e
      LEFT JOIN classes c ON e.class_id = c.id
      LEFT JOIN academic_years ay ON e.academic_year_id = ay.id
      WHERE e.id = $1 AND e.school_id = $2
    `;

    const result = await pool.query(query, [examId, schoolId]);

    if (result.rows.length === 0) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Exam not found", 404);
    }

    // Get exam subjects
    const subjectsQuery = `
      SELECT es.*, s.name as subject_name, s.code as subject_code
      FROM exam_subjects es
      LEFT JOIN subjects s ON es.subject_id = s.id
      WHERE es.exam_id = $1
      ORDER BY s.name
    `;

    const subjectsResult = await pool.query(subjectsQuery, [examId]);

    return {
      ...result.rows[0],
      subjects: subjectsResult.rows,
    };
  }

  async updateExam(examId, updateData, schoolId) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updateData.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(updateData.name);
    }
    if (updateData.examType !== undefined) {
      fields.push(`exam_type = $${paramCount++}`);
      values.push(updateData.examType);
    }
    if (updateData.startDate !== undefined) {
      fields.push(`start_date = $${paramCount++}`);
      values.push(updateData.startDate);
    }
    if (updateData.endDate !== undefined) {
      fields.push(`end_date = $${paramCount++}`);
      values.push(updateData.endDate);
    }
    if (updateData.weightage !== undefined) {
      fields.push(`weightage = $${paramCount++}`);
      values.push(updateData.weightage);
    }

    if (fields.length === 0) {
      throw new AppError(ERROR_CODES.INVALID_INPUT, "No fields to update", 400);
    }

    values.push(examId, schoolId);
    const query = `
      UPDATE exams 
      SET ${fields.join(", ")}
      WHERE id = $${paramCount++} AND school_id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Exam not found", 404);
    }

    return result.rows[0];
  }

  async deleteExam(examId, schoolId) {
    const query = `
      DELETE FROM exams 
      WHERE id = $1 AND school_id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [examId, schoolId]);

    if (result.rows.length === 0) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Exam not found", 404);
    }

    return result.rows[0];
  }

  async addExamSubject(examId, subjectData, schoolId) {
    // Verify exam belongs to school
    const examCheck = await pool.query(
      "SELECT id FROM exams WHERE id = $1 AND school_id = $2",
      [examId, schoolId],
    );

    if (examCheck.rows.length === 0) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Exam not found", 404);
    }

    const query = `
      INSERT INTO exam_subjects (
        school_id, exam_id, subject_id, max_marks, exam_date
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await pool.query(query, [
      schoolId,
      examId,
      subjectData.subjectId,
      subjectData.maxMarks,
      subjectData.examDate || null,
    ]);

    return result.rows[0];
  }

  async updateExamSubject(examSubjectId, updateData, schoolId) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updateData.maxMarks !== undefined) {
      fields.push(`max_marks = $${paramCount++}`);
      values.push(updateData.maxMarks);
    }
    if (updateData.examDate !== undefined) {
      fields.push(`exam_date = $${paramCount++}`);
      values.push(updateData.examDate);
    }

    if (fields.length === 0) {
      throw new AppError(ERROR_CODES.INVALID_INPUT, "No fields to update", 400);
    }

    values.push(examSubjectId, schoolId);
    const query = `
      UPDATE exam_subjects 
      SET ${fields.join(", ")}
      WHERE id = $${paramCount++} AND school_id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Exam subject not found", 404);
    }

    return result.rows[0];
  }

  async deleteExamSubject(examSubjectId, schoolId) {
    const query = `
      DELETE FROM exam_subjects 
      WHERE id = $1 AND school_id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [examSubjectId, schoolId]);

    if (result.rows.length === 0) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Exam subject not found", 404);
    }

    return result.rows[0];
  }
}

module.exports = new ExamsService();
