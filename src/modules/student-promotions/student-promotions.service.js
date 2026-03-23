const pool = require("../../database/connection");
const { ERROR_CODES } = require("../../constants");
const AppError = require("../../utils/AppError");

class StudentPromotionsService {
  async promoteStudents(promotionData, schoolId, userId) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const promotedStudents = [];

      for (const studentId of promotionData.studentIds) {
        // Get current student details
        const studentQuery = await client.query(
          "SELECT current_class_id FROM students WHERE id = $1 AND school_id = $2",
          [studentId, schoolId],
        );

        if (studentQuery.rows.length === 0) {
          throw new AppError(
            ERROR_CODES.RESOURCE_NOT_FOUND,
            `Student with ID ${studentId} not found`,
            404,
          );
        }

        const currentClassId = studentQuery.rows[0].current_class_id;

        // Get current academic year from the from_class
        const fromClassQuery = await client.query(
          "SELECT academic_year_id FROM classes WHERE id = $1",
          [currentClassId],
        );

        const fromAcademicYearId =
          fromClassQuery.rows.length > 0
            ? fromClassQuery.rows[0].academic_year_id
            : null;

        // Record promotion history
        const promotionQuery = `
          INSERT INTO student_promotions (
            school_id, student_id, from_class_id, to_class_id,
            from_academic_year_id, to_academic_year_id, promoted_by, promotion_date
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *
        `;

        const promotionResult = await client.query(promotionQuery, [
          schoolId,
          studentId,
          currentClassId,
          promotionData.toClassId,
          fromAcademicYearId,
          promotionData.toAcademicYearId,
          userId,
          promotionData.promotionDate || new Date().toISOString().split("T")[0],
        ]);

        // Update student's current class
        const updateQuery = `
          UPDATE students 
          SET current_class_id = $1
          WHERE id = $2 AND school_id = $3
          RETURNING *
        `;

        const updateResult = await client.query(updateQuery, [
          promotionData.toClassId,
          studentId,
          schoolId,
        ]);

        promotedStudents.push({
          promotion: promotionResult.rows[0],
          student: updateResult.rows[0],
        });
      }

      await client.query("COMMIT");
      return promotedStudents;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async getPromotionsBySchool(schoolId, filters = {}) {
    let query = `
      SELECT sp.*, 
             s.full_name as student_name, s.admission_number, s.roll_number,
             fc.name as from_class_name, fc.section as from_class_section,
             tc.name as to_class_name, tc.section as to_class_section,
             fay.year_name as from_academic_year,
             tay.year_name as to_academic_year,
             u.full_name as promoted_by_name
      FROM student_promotions sp
      LEFT JOIN students s ON sp.student_id = s.id
      LEFT JOIN classes fc ON sp.from_class_id = fc.id
      LEFT JOIN classes tc ON sp.to_class_id = tc.id
      LEFT JOIN academic_years fay ON sp.from_academic_year_id = fay.id
      LEFT JOIN academic_years tay ON sp.to_academic_year_id = tay.id
      LEFT JOIN users u ON sp.promoted_by = u.id
      WHERE sp.school_id = $1
    `;

    const params = [schoolId];
    let paramCount = 2;

    if (filters.studentId) {
      query += ` AND sp.student_id = $${paramCount++}`;
      params.push(filters.studentId);
    }

    if (filters.fromClassId) {
      query += ` AND sp.from_class_id = $${paramCount++}`;
      params.push(filters.fromClassId);
    }

    if (filters.toClassId) {
      query += ` AND sp.to_class_id = $${paramCount++}`;
      params.push(filters.toClassId);
    }

    if (filters.academicYearId) {
      query += ` AND (sp.from_academic_year_id = $${paramCount} OR sp.to_academic_year_id = $${paramCount})`;
      params.push(filters.academicYearId);
      paramCount++;
    }

    query += ` ORDER BY sp.promotion_date DESC, s.full_name`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getStudentPromotionHistory(studentId, schoolId) {
    const query = `
      SELECT sp.*, 
             fc.name as from_class_name, fc.section as from_class_section,
             tc.name as to_class_name, tc.section as to_class_section,
             fay.year_name as from_academic_year,
             tay.year_name as to_academic_year,
             u.full_name as promoted_by_name
      FROM student_promotions sp
      LEFT JOIN classes fc ON sp.from_class_id = fc.id
      LEFT JOIN classes tc ON sp.to_class_id = tc.id
      LEFT JOIN academic_years fay ON sp.from_academic_year_id = fay.id
      LEFT JOIN academic_years tay ON sp.to_academic_year_id = tay.id
      LEFT JOIN users u ON sp.promoted_by = u.id
      WHERE sp.student_id = $1 AND sp.school_id = $2
      ORDER BY sp.promotion_date DESC
    `;

    const result = await pool.query(query, [studentId, schoolId]);
    return result.rows;
  }

  async getPromotionById(promotionId, schoolId) {
    const query = `
      SELECT sp.*, 
             s.full_name as student_name, s.admission_number,
             fc.name as from_class_name, fc.section as from_class_section,
             tc.name as to_class_name, tc.section as to_class_section,
             fay.year_name as from_academic_year,
             tay.year_name as to_academic_year,
             u.full_name as promoted_by_name
      FROM student_promotions sp
      LEFT JOIN students s ON sp.student_id = s.id
      LEFT JOIN classes fc ON sp.from_class_id = fc.id
      LEFT JOIN classes tc ON sp.to_class_id = tc.id
      LEFT JOIN academic_years fay ON sp.from_academic_year_id = fay.id
      LEFT JOIN academic_years tay ON sp.to_academic_year_id = tay.id
      LEFT JOIN users u ON sp.promoted_by = u.id
      WHERE sp.id = $1 AND sp.school_id = $2
    `;

    const result = await pool.query(query, [promotionId, schoolId]);

    if (result.rows.length === 0) {
      throw new AppError(
        ERROR_CODES.RESOURCE_NOT_FOUND,
        "Promotion record not found",
        404,
      );
    }

    return result.rows[0];
  }

  async getEligibleStudents(classId, schoolId) {
    const query = `
      SELECT s.*, c.name as class_name, c.section as class_section
      FROM students s
      LEFT JOIN classes c ON s.current_class_id = c.id
      WHERE s.current_class_id = $1 AND s.school_id = $2 AND s.status = 'active'
      ORDER BY s.roll_number, s.full_name
    `;

    const result = await pool.query(query, [classId, schoolId]);
    return result.rows;
  }

  async deletePromotion(promotionId, schoolId) {
    const query = `
      DELETE FROM student_promotions 
      WHERE id = $1 AND school_id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [promotionId, schoolId]);

    if (result.rows.length === 0) {
      throw new AppError(
        ERROR_CODES.RESOURCE_NOT_FOUND,
        "Promotion record not found",
        404,
      );
    }

    return result.rows[0];
  }
}

module.exports = new StudentPromotionsService();
