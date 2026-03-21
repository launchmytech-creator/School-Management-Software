const pool = require("../../database/connection");
const { ERROR_CODES } = require("../../constants");
const AppError = require("../../utils/AppError");

class ParentDashboardService {
  async getMyChildren(parentId, schoolId) {
    const query = `
      SELECT s.id, s.admission_number, s.full_name, s.date_of_birth, 
             s.gender, s.roll_number, s.status, s.phone,
             c.name as class_name, c.section as class_section,
             ay.year_name as academic_year
      FROM students s
      LEFT JOIN classes c ON s.current_class_id = c.id
      LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
      WHERE s.parent_id = $1 AND s.school_id = $2 AND s.status = 'active'
      ORDER BY s.full_name
    `;

    const result = await pool.query(query, [parentId, schoolId]);
    return result.rows;
  }

  async getChildMarks(childId, parentId, schoolId) {
    // Verify child belongs to parent
    await this.verifyChildOwnership(childId, parentId, schoolId);

    const query = `
      SELECT er.id, er.marks_obtained, er.grade, er.is_absent,
             es.max_marks, es.exam_date,
             e.name as exam_name, e.exam_type,
             sub.name as subject_name, sub.code as subject_code,
             c.name as class_name, c.section as class_section
      FROM exam_results er
      JOIN exam_subjects es ON er.exam_subject_id = es.id
      JOIN exams e ON es.exam_id = e.id
      JOIN subjects sub ON es.subject_id = sub.id
      JOIN students s ON er.student_id = s.id
      JOIN classes c ON e.class_id = c.id
      WHERE er.student_id = $1 AND er.school_id = $2
      ORDER BY e.start_date DESC, sub.name
    `;

    const result = await pool.query(query, [childId, schoolId]);
    return result.rows;
  }

  async getChildAttendance(childId, parentId, schoolId, filters = {}) {
    // Verify child belongs to parent
    await this.verifyChildOwnership(childId, parentId, schoolId);

    let query = `
      SELECT sa.id, sa.attendance_date, sa.status,
             c.name as class_name, c.section as class_section,
             u.full_name as marked_by
      FROM student_attendance sa
      JOIN classes c ON sa.class_id = c.id
      LEFT JOIN users u ON sa.marked_by = u.id
      WHERE sa.student_id = $1 AND sa.school_id = $2
    `;

    const params = [childId, schoolId];
    let paramCount = 3;

    if (filters.startDate) {
      query += ` AND sa.attendance_date >= $${paramCount++}`;
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      query += ` AND sa.attendance_date <= $${paramCount++}`;
      params.push(filters.endDate);
    }

    query += ` ORDER BY sa.attendance_date DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getChildAttendanceSummary(childId, parentId, schoolId, academicYearId) {
    // Verify child belongs to parent
    await this.verifyChildOwnership(childId, parentId, schoolId);

    // Get attendance summary
    const attendanceQuery = `
      SELECT 
        COUNT(*) as total_days,
        COUNT(CASE WHEN status = 'present' THEN 1 END) as present_days,
        COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_days,
        COUNT(CASE WHEN status = 'late' THEN 1 END) as late_days
      FROM student_attendance sa
      JOIN classes c ON sa.class_id = c.id
      WHERE sa.student_id = $1 AND sa.school_id = $2
    `;

    const params = [childId, schoolId];
    let attendanceQueryFinal = attendanceQuery;

    if (academicYearId) {
      attendanceQueryFinal += ` AND c.academic_year_id = $3`;
      params.push(academicYearId);
    }

    const attendanceResult = await pool.query(attendanceQueryFinal, params);

    // Get working days (excluding holidays)
    let workingDaysQuery = `
      SELECT COUNT(DISTINCT sa.attendance_date) as working_days
      FROM student_attendance sa
      JOIN classes c ON sa.class_id = c.id
      WHERE sa.school_id = $1
    `;

    const workingParams = [schoolId];

    if (academicYearId) {
      workingDaysQuery += ` AND c.academic_year_id = $2`;
      workingParams.push(academicYearId);
    }

    const workingDaysResult = await pool.query(workingDaysQuery, workingParams);

    const summary = attendanceResult.rows[0];
    const workingDays = parseInt(workingDaysResult.rows[0].working_days) || 0;
    const presentDays = parseInt(summary.present_days) || 0;

    return {
      total_days: parseInt(summary.total_days) || 0,
      present_days: presentDays,
      absent_days: parseInt(summary.absent_days) || 0,
      late_days: parseInt(summary.late_days) || 0,
      working_days: workingDays,
      attendance_percentage:
        workingDays > 0
          ? ((presentDays / workingDays) * 100).toFixed(2)
          : "0.00",
    };
  }

  async getChildFeeStatus(childId, parentId, schoolId) {
    // Verify child belongs to parent
    await this.verifyChildOwnership(childId, parentId, schoolId);

    const query = `
      SELECT ft.id, ft.term_number, ft.original_amount, ft.amount_due, 
             ft.amount_paid, ft.waiver_amount, ft.due_date, ft.payment_date, 
             ft.status, ft.payment_mode, ft.receipt_number,
             fs.fee_type,
             ay.year_name as academic_year
      FROM fee_transactions ft
      JOIN fee_structures fs ON ft.fee_structure_id = fs.id
      JOIN academic_years ay ON ft.academic_year_id = ay.id
      WHERE ft.student_id = $1 AND ft.school_id = $2
      ORDER BY ay.start_date DESC, ft.term_number
    `;

    const result = await pool.query(query, [childId, schoolId]);
    return result.rows;
  }

  async getChildSyllabusProgress(childId, parentId, schoolId) {
    // Verify child belongs to parent
    await this.verifyChildOwnership(childId, parentId, schoolId);

    const query = `
      SELECT sub.name as subject_name, sub.code as subject_code,
             ch.name as chapter_name, ch.sequence_number,
             sc.status, sc.completed_date,
             u.full_name as completed_by
      FROM students s
      JOIN classes c ON s.current_class_id = c.id
      JOIN class_subjects cs ON cs.class_id = c.id
      JOIN subjects sub ON cs.subject_id = sub.id
      JOIN chapters ch ON ch.subject_id = sub.id
      LEFT JOIN syllabus_completion sc ON sc.class_subject_id = cs.id AND sc.chapter_id = ch.id
      LEFT JOIN users u ON sc.completed_by = u.id
      WHERE s.id = $1 AND s.school_id = $2
      ORDER BY sub.name, ch.sequence_number
    `;

    const result = await pool.query(query, [childId, schoolId]);
    return result.rows;
  }

  async getChildTeachers(childId, parentId, schoolId) {
    // Verify child belongs to parent
    await this.verifyChildOwnership(childId, parentId, schoolId);

    const query = `
      SELECT DISTINCT u.id, u.full_name, u.email, u.phone,
             sub.name as subject_name, sub.code as subject_code
      FROM students s
      JOIN classes c ON s.current_class_id = c.id
      JOIN teacher_allocations ta ON ta.class_id = c.id AND ta.academic_year_id = c.academic_year_id
      JOIN users u ON ta.teacher_id = u.id
      JOIN subjects sub ON ta.subject_id = sub.id
      WHERE s.id = $1 AND s.school_id = $2 AND u.is_active = true
      ORDER BY sub.name
    `;

    const result = await pool.query(query, [childId, schoolId]);
    return result.rows;
  }

  async getDashboardOverview(parentId, schoolId) {
    const children = await this.getMyChildren(parentId, schoolId);

    const overview = await Promise.all(
      children.map(async (child) => {
        // Get fee summary
        const feeSummary = await pool.query(
          `SELECT 
            COUNT(*) as total_fees,
            COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_fees,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_fees,
            SUM(CASE WHEN status = 'pending' THEN amount_due ELSE 0 END) as total_due
          FROM fee_transactions
          WHERE student_id = $1 AND school_id = $2`,
          [child.id, schoolId],
        );

        // Get recent attendance
        const recentAttendance = await pool.query(
          `SELECT status, attendance_date
          FROM student_attendance
          WHERE student_id = $1 AND school_id = $2
          ORDER BY attendance_date DESC
          LIMIT 5`,
          [child.id, schoolId],
        );

        return {
          student: child,
          fee_summary: feeSummary.rows[0],
          recent_attendance: recentAttendance.rows,
        };
      }),
    );

    return overview;
  }

  async verifyChildOwnership(childId, parentId, schoolId) {
    const query = `
      SELECT id FROM students 
      WHERE id = $1 AND parent_id = $2 AND school_id = $3
    `;

    const result = await pool.query(query, [childId, parentId, schoolId]);

    if (result.rows.length === 0) {
      throw new AppError(
        ERROR_CODES.AUTH_UNAUTHORIZED,
        "You are not authorized to access this student's information",
        403,
      );
    }
  }
}

module.exports = new ParentDashboardService();
