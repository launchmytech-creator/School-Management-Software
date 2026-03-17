const pool = require("../../database/connection");
const { ERROR_CODES } = require("../../constants");
const AppError = require("../../utils/AppError");

class ClassSubjectsService {
  async assignSubjectToClass(assignmentData, schoolId) {
    const query = `
      INSERT INTO class_subjects (
        school_id, class_id, subject_id, academic_year_id, max_marks
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await pool.query(query, [
      schoolId,
      assignmentData.classId,
      assignmentData.subjectId,
      assignmentData.academicYearId,
      assignmentData.maxMarks || null,
    ]);

    return result.rows[0];
  }

  async getSubjectsByClass(classId, schoolId, academicYearId = null) {
    let query = `
      SELECT cs.*, 
             s.name as subject_name, s.code as subject_code,
             c.name as class_name, c.section as class_section,
             ay.year_name
      FROM class_subjects cs
      JOIN subjects s ON cs.subject_id = s.id
      JOIN classes c ON cs.class_id = c.id
      JOIN academic_years ay ON cs.academic_year_id = ay.id
      WHERE cs.class_id = $1 AND cs.school_id = $2
    `;

    const params = [classId, schoolId];

    if (academicYearId) {
      query += ` AND cs.academic_year_id = $3`;
      params.push(academicYearId);
    }

    query += ` ORDER BY s.name`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getClassesBySubject(subjectId, schoolId, academicYearId = null) {
    let query = `
      SELECT cs.*, 
             s.name as subject_name, s.code as subject_code,
             c.name as class_name, c.section as class_section,
             ay.year_name
      FROM class_subjects cs
      JOIN subjects s ON cs.subject_id = s.id
      JOIN classes c ON cs.class_id = c.id
      JOIN academic_years ay ON cs.academic_year_id = ay.id
      WHERE cs.subject_id = $1 AND cs.school_id = $2
    `;

    const params = [subjectId, schoolId];

    if (academicYearId) {
      query += ` AND cs.academic_year_id = $3`;
      params.push(academicYearId);
    }

    query += ` ORDER BY c.name, c.section`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getClassSubjectById(classSubjectId, schoolId) {
    const query = `
      SELECT cs.*, 
             s.name as subject_name, s.code as subject_code,
             c.name as class_name, c.section as class_section,
             ay.year_name
      FROM class_subjects cs
      JOIN subjects s ON cs.subject_id = s.id
      JOIN classes c ON cs.class_id = c.id
      JOIN academic_years ay ON cs.academic_year_id = ay.id
      WHERE cs.id = $1 AND cs.school_id = $2
    `;

    const result = await pool.query(query, [classSubjectId, schoolId]);

    if (result.rows.length === 0) {
      throw new AppError(
        ERROR_CODES.NOT_FOUND,
        "Class subject assignment not found",
        404,
      );
    }

    return result.rows[0];
  }

  async updateClassSubject(classSubjectId, updateData, schoolId) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updateData.maxMarks !== undefined) {
      fields.push(`max_marks = $${paramCount++}`);
      values.push(updateData.maxMarks);
    }

    if (fields.length === 0) {
      throw new AppError(ERROR_CODES.INVALID_INPUT, "No fields to update", 400);
    }

    values.push(classSubjectId, schoolId);
    const query = `
      UPDATE class_subjects 
      SET ${fields.join(", ")}
      WHERE id = $${paramCount++} AND school_id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new AppError(
        ERROR_CODES.NOT_FOUND,
        "Class subject assignment not found",
        404,
      );
    }

    return result.rows[0];
  }

  async removeSubjectFromClass(classSubjectId, schoolId) {
    const query = `
      DELETE FROM class_subjects 
      WHERE id = $1 AND school_id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [classSubjectId, schoolId]);

    if (result.rows.length === 0) {
      throw new AppError(
        ERROR_CODES.NOT_FOUND,
        "Class subject assignment not found",
        404,
      );
    }

    return result.rows[0];
  }
}

module.exports = new ClassSubjectsService();
