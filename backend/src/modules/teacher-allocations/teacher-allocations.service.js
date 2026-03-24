const pool = require("../../database/connection");
const { ERROR_CODES } = require("../../constants");
const AppError = require("../../utils/AppError");

class TeacherAllocationsService {
  async allocateTeacher(allocationData, schoolId) {
    const query = `
      INSERT INTO teacher_allocations (
        school_id, teacher_id, class_id, subject_id, academic_year_id
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await pool.query(query, [
      schoolId,
      allocationData.teacherId,
      allocationData.classId,
      allocationData.subjectId,
      allocationData.academicYearId,
    ]);

    return result.rows[0];
  }

  async getAllocationsByTeacher(teacherId, schoolId, academicYearId = null) {
    let query = `
      SELECT ta.*, 
             u.full_name as teacher_name, u.email as teacher_email,
             c.name as class_name, c.section as class_section,
             s.name as subject_name, s.code as subject_code,
             ay.year_name
      FROM teacher_allocations ta
      JOIN users u ON ta.teacher_id = u.id
      JOIN classes c ON ta.class_id = c.id
      JOIN subjects s ON ta.subject_id = s.id
      JOIN academic_years ay ON ta.academic_year_id = ay.id
      WHERE ta.teacher_id = $1 AND ta.school_id = $2
    `;

    const params = [teacherId, schoolId];

    if (academicYearId) {
      query += ` AND ta.academic_year_id = $3`;
      params.push(academicYearId);
    }

    query += ` ORDER BY c.name, s.name`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getAllocationsByClass(classId, schoolId, academicYearId = null) {
    let query = `
      SELECT ta.*, 
             u.full_name as teacher_name, u.email as teacher_email, u.phone as teacher_phone,
             c.name as class_name, c.section as class_section,
             s.name as subject_name, s.code as subject_code,
             ay.year_name
      FROM teacher_allocations ta
      JOIN users u ON ta.teacher_id = u.id
      JOIN classes c ON ta.class_id = c.id
      JOIN subjects s ON ta.subject_id = s.id
      JOIN academic_years ay ON ta.academic_year_id = ay.id
      WHERE ta.class_id = $1 AND ta.school_id = $2
    `;

    const params = [classId, schoolId];

    if (academicYearId) {
      query += ` AND ta.academic_year_id = $3`;
      params.push(academicYearId);
    }

    query += ` ORDER BY s.name`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getAllocationsBySchool(schoolId, academicYearId = null) {
    let query = `
      SELECT ta.*, 
             u.full_name as teacher_name, u.email as teacher_email,
             c.name as class_name, c.section as class_section,
             s.name as subject_name, s.code as subject_code,
             ay.year_name
      FROM teacher_allocations ta
      JOIN users u ON ta.teacher_id = u.id
      JOIN classes c ON ta.class_id = c.id
      JOIN subjects s ON ta.subject_id = s.id
      JOIN academic_years ay ON ta.academic_year_id = ay.id
      WHERE ta.school_id = $1
    `;

    const params = [schoolId];

    if (academicYearId) {
      query += ` AND ta.academic_year_id = $2`;
      params.push(academicYearId);
    }

    query += ` ORDER BY u.full_name, c.name, s.name`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getAllocationById(allocationId, schoolId) {
    const query = `
      SELECT ta.*, 
             u.full_name as teacher_name, u.email as teacher_email,
             c.name as class_name, c.section as class_section,
             s.name as subject_name, s.code as subject_code,
             ay.year_name
      FROM teacher_allocations ta
      JOIN users u ON ta.teacher_id = u.id
      JOIN classes c ON ta.class_id = c.id
      JOIN subjects s ON ta.subject_id = s.id
      JOIN academic_years ay ON ta.academic_year_id = ay.id
      WHERE ta.id = $1 AND ta.school_id = $2
    `;

    const result = await pool.query(query, [allocationId, schoolId]);

    if (result.rows.length === 0) {
      throw new AppError(
        ERROR_CODES.NOT_FOUND,
        "Teacher allocation not found",
        404,
      );
    }

    return result.rows[0];
  }

  async removeAllocation(allocationId, schoolId) {
    const query = `
      DELETE FROM teacher_allocations 
      WHERE id = $1 AND school_id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [allocationId, schoolId]);

    if (result.rows.length === 0) {
      throw new AppError(
        ERROR_CODES.NOT_FOUND,
        "Teacher allocation not found",
        404,
      );
    }

    return result.rows[0];
  }
}

module.exports = new TeacherAllocationsService();
