const pool = require("../../database/connection");
const { ERROR_CODES } = require("../../constants");
const AppError = require("../../utils/AppError");

class AssignmentsService {
  async createAssignment(assignmentData, schoolId, teacherId) {
    const query = `
      INSERT INTO assignments (
        school_id, class_id, subject_id, academic_year_id,
        teacher_id, title, description, due_date, max_marks, assignment_type
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const result = await pool.query(query, [
      schoolId,
      assignmentData.classId,
      assignmentData.subjectId,
      assignmentData.academicYearId,
      teacherId,
      assignmentData.title,
      assignmentData.description || null,
      assignmentData.dueDate || null,
      assignmentData.maxMarks || null,
      assignmentData.assignmentType || "homework",
    ]);

    return result.rows[0];
  }

  async getAssignments(schoolId, filters = {}) {
    let query = `
      SELECT a.*, 
             c.name as class_name,
             c.section as class_section,
             s.name as subject_name,
             s.code as subject_code,
             u.full_name as teacher_name,
             ay.year_name as academic_year_name,
             (SELECT COUNT(*) FROM assignment_submissions WHERE assignment_id = a.id) as submission_count
      FROM assignments a
      LEFT JOIN classes c ON a.class_id = c.id
      LEFT JOIN subjects s ON a.subject_id = s.id
      LEFT JOIN users u ON a.teacher_id = u.id
      LEFT JOIN academic_years ay ON a.academic_year_id = ay.id
      WHERE a.school_id = $1
    `;

    const params = [schoolId];
    let paramCount = 2;

    if (filters.classId) {
      query += ` AND a.class_id = $${paramCount++}`;
      params.push(filters.classId);
    }

    if (filters.subjectId) {
      query += ` AND a.subject_id = $${paramCount++}`;
      params.push(filters.subjectId);
    }

    if (filters.academicYearId) {
      query += ` AND a.academic_year_id = $${paramCount++}`;
      params.push(filters.academicYearId);
    }

    if (filters.teacherId) {
      query += ` AND a.teacher_id = $${paramCount++}`;
      params.push(filters.teacherId);
    }

    if (filters.assignmentType) {
      query += ` AND a.assignment_type = $${paramCount++}`;
      params.push(filters.assignmentType);
    }

    query += ` ORDER BY a.created_at DESC`;

    if (filters.limit) {
      query += ` LIMIT $${paramCount++}`;
      params.push(parseInt(filters.limit));
    }

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getAssignmentById(assignmentId, schoolId) {
    const query = `
      SELECT a.*, 
             c.name as class_name,
             c.section as class_section,
             s.name as subject_name,
             s.code as subject_code,
             u.full_name as teacher_name,
             ay.year_name as academic_year_name
      FROM assignments a
      LEFT JOIN classes c ON a.class_id = c.id
      LEFT JOIN subjects s ON a.subject_id = s.id
      LEFT JOIN users u ON a.teacher_id = u.id
      LEFT JOIN academic_years ay ON a.academic_year_id = ay.id
      WHERE a.id = $1 AND a.school_id = $2
    `;

    const result = await pool.query(query, [assignmentId, schoolId]);

    if (result.rows.length === 0) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Assignment not found", 404);
    }

    return result.rows[0];
  }

  async updateAssignment(assignmentId, updateData, schoolId) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updateData.title !== undefined) {
      fields.push(`title = $${paramCount++}`);
      values.push(updateData.title);
    }
    if (updateData.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(updateData.description);
    }
    if (updateData.dueDate !== undefined) {
      fields.push(`due_date = $${paramCount++}`);
      values.push(updateData.dueDate);
    }
    if (updateData.maxMarks !== undefined) {
      fields.push(`max_marks = $${paramCount++}`);
      values.push(updateData.maxMarks);
    }
    if (updateData.assignmentType !== undefined) {
      fields.push(`assignment_type = $${paramCount++}`);
      values.push(updateData.assignmentType);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);

    if (fields.length === 1) {
      throw new AppError(ERROR_CODES.INVALID_INPUT, "No fields to update", 400);
    }

    values.push(assignmentId, schoolId);
    const query = `
      UPDATE assignments 
      SET ${fields.join(", ")}
      WHERE id = $${paramCount++} AND school_id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Assignment not found", 404);
    }

    return result.rows[0];
  }

  async deleteAssignment(assignmentId, schoolId) {
    const query = `
      DELETE FROM assignments 
      WHERE id = $1 AND school_id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [assignmentId, schoolId]);

    if (result.rows.length === 0) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Assignment not found", 404);
    }

    return result.rows[0];
  }

  async submitAssignment(assignmentId, studentId, submissionData) {
    const checkQuery = `
      SELECT id FROM assignment_submissions 
      WHERE assignment_id = $1 AND student_id = $2
    `;
    const existing = await pool.query(checkQuery, [assignmentId, studentId]);

    if (existing.rows.length > 0) {
      const updateQuery = `
        UPDATE assignment_submissions 
        SET submission_text = $1, file_url = $2, submission_date = CURRENT_TIMESTAMP
        WHERE assignment_id = $3 AND student_id = $4
        RETURNING *
      `;
      const result = await pool.query(updateQuery, [
        submissionData.submissionText || null,
        submissionData.fileUrl || null,
        assignmentId,
        studentId,
      ]);
      return result.rows[0];
    }

    const query = `
      INSERT INTO assignment_submissions (assignment_id, student_id, submission_text, file_url)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await pool.query(query, [
      assignmentId,
      studentId,
      submissionData.submissionText || null,
      submissionData.fileUrl || null,
    ]);

    return result.rows[0];
  }

  async gradeSubmission(submissionId, gradeData, gradedBy) {
    const query = `
      UPDATE assignment_submissions 
      SET marks_obtained = $1, feedback = $2, graded_by = $3, graded_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `;

    const result = await pool.query(query, [
      gradeData.marksObtained,
      gradeData.feedback || null,
      gradedBy,
      submissionId,
    ]);

    if (result.rows.length === 0) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Submission not found", 404);
    }

    return result.rows[0];
  }

  async getSubmissions(assignmentId, schoolId) {
    const query = `
      SELECT s.*, 
             u.full_name as student_name,
             u.admission_number,
             g.full_name as graded_by_name
      FROM assignment_submissions s
      LEFT JOIN users u ON s.student_id = u.id
      LEFT JOIN users g ON s.graded_by = g.id
      LEFT JOIN assignments a ON s.assignment_id = a.id
      WHERE s.assignment_id = $1 AND a.school_id = $2
      ORDER BY s.submission_date DESC
    `;

    const result = await pool.query(query, [assignmentId, schoolId]);
    return result.rows;
  }
}

module.exports = new AssignmentsService();
