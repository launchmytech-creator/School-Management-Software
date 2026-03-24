const pool = require("../../database/connection");
const { ERROR_CODES } = require("../../constants");
const AppError = require("../../utils/AppError");

class ExamResultsService {
  async enterMarks(marksData, schoolId, userId) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const results = [];

      for (const record of marksData.results) {
        // Check if result already exists
        const existingQuery = await client.query(
          "SELECT id FROM exam_results WHERE exam_subject_id = $1 AND student_id = $2",
          [marksData.examSubjectId, record.studentId],
        );

        if (existingQuery.rows.length > 0) {
          // Update existing result
          const updateQuery = `
            UPDATE exam_results 
            SET marks_obtained = $1, grade = $2, is_absent = $3, entered_by = $4, entered_at = CURRENT_TIMESTAMP
            WHERE exam_subject_id = $5 AND student_id = $6
            RETURNING *
          `;
          const result = await client.query(updateQuery, [
            record.marksObtained || null,
            record.grade || null,
            record.isAbsent || false,
            userId,
            marksData.examSubjectId,
            record.studentId,
          ]);
          results.push(result.rows[0]);
        } else {
          // Insert new result
          const insertQuery = `
            INSERT INTO exam_results (
              school_id, exam_subject_id, student_id, marks_obtained, 
              grade, is_absent, entered_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
          `;
          const result = await client.query(insertQuery, [
            schoolId,
            marksData.examSubjectId,
            record.studentId,
            record.marksObtained || null,
            record.grade || null,
            record.isAbsent || false,
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

  async getResultsBySchool(schoolId, filters = {}) {
    let query = `
      SELECT er.*, 
             s.full_name as student_name, s.admission_number, s.roll_number,
             es.max_marks, es.exam_date,
             sub.name as subject_name, sub.code as subject_code,
             e.name as exam_name, e.exam_type,
             c.name as class_name, c.section as class_section,
             u.full_name as entered_by_name
      FROM exam_results er
      LEFT JOIN students s ON er.student_id = s.id
      LEFT JOIN exam_subjects es ON er.exam_subject_id = es.id
      LEFT JOIN subjects sub ON es.subject_id = sub.id
      LEFT JOIN exams e ON es.exam_id = e.id
      LEFT JOIN classes c ON e.class_id = c.id
      LEFT JOIN users u ON er.entered_by = u.id
      WHERE er.school_id = $1
    `;

    const params = [schoolId];
    let paramCount = 2;

    if (filters.studentId) {
      query += ` AND er.student_id = $${paramCount++}`;
      params.push(filters.studentId);
    }

    if (filters.examId) {
      query += ` AND es.exam_id = $${paramCount++}`;
      params.push(filters.examId);
    }

    if (filters.classId) {
      query += ` AND e.class_id = $${paramCount++}`;
      params.push(filters.classId);
    }

    if (filters.subjectId) {
      query += ` AND es.subject_id = $${paramCount++}`;
      params.push(filters.subjectId);
    }

    query += ` ORDER BY e.start_date DESC, s.roll_number, s.full_name`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getStudentResults(studentId, schoolId, filters = {}) {
    let query = `
      SELECT er.*, 
             es.max_marks, es.exam_date,
             sub.name as subject_name, sub.code as subject_code,
             e.name as exam_name, e.exam_type, e.start_date,
             ay.year_name as academic_year_name
      FROM exam_results er
      LEFT JOIN exam_subjects es ON er.exam_subject_id = es.id
      LEFT JOIN subjects sub ON es.subject_id = sub.id
      LEFT JOIN exams e ON es.exam_id = e.id
      LEFT JOIN academic_years ay ON e.academic_year_id = ay.id
      WHERE er.student_id = $1 AND er.school_id = $2
    `;

    const params = [studentId, schoolId];
    let paramCount = 3;

    if (filters.academicYearId) {
      query += ` AND e.academic_year_id = $${paramCount++}`;
      params.push(filters.academicYearId);
    }

    if (filters.examType) {
      query += ` AND e.exam_type = $${paramCount++}`;
      params.push(filters.examType);
    }

    query += ` ORDER BY e.start_date DESC, sub.name`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getExamSubjectResults(examSubjectId, schoolId) {
    const query = `
      SELECT er.*, 
             s.full_name as student_name, s.admission_number, s.roll_number,
             es.max_marks
      FROM exam_results er
      LEFT JOIN students s ON er.student_id = s.id
      LEFT JOIN exam_subjects es ON er.exam_subject_id = es.id
      WHERE er.exam_subject_id = $1 AND er.school_id = $2
      ORDER BY s.roll_number, s.full_name
    `;

    const result = await pool.query(query, [examSubjectId, schoolId]);
    return result.rows;
  }

  async getClassPerformance(examId, schoolId) {
    const query = `
      SELECT 
        sub.name as subject_name,
        sub.code as subject_code,
        es.max_marks,
        COUNT(er.id) as total_students,
        COUNT(er.id) FILTER (WHERE er.is_absent = false) as students_appeared,
        AVG(er.marks_obtained) FILTER (WHERE er.is_absent = false) as average_marks,
        MAX(er.marks_obtained) as highest_marks,
        MIN(er.marks_obtained) FILTER (WHERE er.is_absent = false) as lowest_marks
      FROM exam_subjects es
      LEFT JOIN subjects sub ON es.subject_id = sub.id
      LEFT JOIN exam_results er ON es.id = er.exam_subject_id
      WHERE es.exam_id = $1 AND es.school_id = $2
      GROUP BY sub.name, sub.code, es.max_marks
      ORDER BY sub.name
    `;

    const result = await pool.query(query, [examId, schoolId]);
    return result.rows;
  }

  async deleteResult(resultId, schoolId) {
    const query = `
      DELETE FROM exam_results 
      WHERE id = $1 AND school_id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [resultId, schoolId]);

    if (result.rows.length === 0) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Exam result not found", 404);
    }

    return result.rows[0];
  }
}

module.exports = new ExamResultsService();
