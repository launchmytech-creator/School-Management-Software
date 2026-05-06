const pool = require("../../database/connection");
const { ERROR_CODES, ERROR_MESSAGES } = require("../../constants");
const AppError = require("../../utils/AppError");
const { buildPaginationQuery, formatPaginationResult } = require("../../utils/pagination");

class StudentsService {
  async createStudent(studentData, schoolId) {
    const query = `
      INSERT INTO students (
        school_id, admission_number, full_name, date_of_birth, 
        gender, address, phone, admission_date, current_class_id, 
        parent_id, roll_number, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const result = await pool.query(query, [
      schoolId,
      studentData.admissionNumber,
      studentData.fullName,
      studentData.dateOfBirth || null,
      studentData.gender || null,
      studentData.address || null,
      studentData.phone || null,
      studentData.admissionDate,
      studentData.currentClassId || null,
      studentData.parentId || null,
      studentData.rollNumber || null,
      studentData.status || "active",
    ]);

    return result.rows[0];
  }

  async getStudentsBySchool(schoolId, filters = {}, pagination = {}) {
    let query = `
      SELECT s.*, c.name as class_name, c.section as class_section,
             u.full_name as parent_name, u.phone as parent_phone
      FROM students s
      LEFT JOIN classes c ON s.current_class_id = c.id
      LEFT JOIN users u ON s.parent_id = u.id
      WHERE s.school_id = $1
    `;

    const params = [schoolId];
    let paramCount = 2;

    if (filters.classId) {
      query += ` AND s.current_class_id = $${paramCount++}`;
      params.push(filters.classId);
    }

    if (filters.status) {
      query += ` AND s.status = $${paramCount++}`;
      params.push(filters.status);
    }

    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      query += ` AND (LOWER(s.full_name) LIKE LOWER($${paramCount}) OR LOWER(s.admission_number) LIKE LOWER($${paramCount}) OR LOWER(s.phone) LIKE LOWER($${paramCount}))`;
      params.push(searchTerm);
      paramCount++;
    }

    query += ` ORDER BY s.full_name`;

    if (pagination.page || pagination.limit) {
      const { query: paginatedQuery, params: paginatedParams, countQuery, countParams, page, limit } =
        buildPaginationQuery(query, params, pagination);

      const [rowsResult, countResult] = await Promise.all([
        pool.query(paginatedQuery, paginatedParams),
        pool.query(countQuery, countParams),
      ]);

      return formatPaginationResult(rowsResult.rows, countResult.rows, page, limit);
    }

    const result = await pool.query(query, params);
    return { data: result.rows, pagination: null };
  }

  async getStudentById(studentId, schoolId) {
    const query = `
      SELECT s.*, c.name as class_name, c.section as class_section,
             u.full_name as parent_name, u.email as parent_email, u.phone as parent_phone
      FROM students s
      LEFT JOIN classes c ON s.current_class_id = c.id
      LEFT JOIN users u ON s.parent_id = u.id
      WHERE s.id = $1 AND s.school_id = $2
    `;

    const result = await pool.query(query, [studentId, schoolId]);

    if (result.rows.length === 0) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Student not found", 404);
    }

    return result.rows[0];
  }

  async updateStudent(studentId, updateData, schoolId) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updateData.fullName !== undefined) {
      fields.push(`full_name = $${paramCount++}`);
      values.push(updateData.fullName);
    }
    if (updateData.dateOfBirth !== undefined) {
      fields.push(`date_of_birth = $${paramCount++}`);
      values.push(updateData.dateOfBirth);
    }
    if (updateData.gender !== undefined) {
      fields.push(`gender = $${paramCount++}`);
      values.push(updateData.gender);
    }
    if (updateData.address !== undefined) {
      fields.push(`address = $${paramCount++}`);
      values.push(updateData.address);
    }
    if (updateData.phone !== undefined) {
      fields.push(`phone = $${paramCount++}`);
      values.push(updateData.phone);
    }
    if (updateData.currentClassId !== undefined) {
      fields.push(`current_class_id = $${paramCount++}`);
      values.push(updateData.currentClassId);
    }
    if (updateData.parentId !== undefined) {
      fields.push(`parent_id = $${paramCount++}`);
      values.push(updateData.parentId);
    }
    if (updateData.rollNumber !== undefined) {
      fields.push(`roll_number = $${paramCount++}`);
      values.push(updateData.rollNumber);
    }
    if (updateData.status !== undefined) {
      fields.push(`status = $${paramCount++}`);
      values.push(updateData.status);
    }

    if (fields.length === 0) {
      throw new AppError(ERROR_CODES.INVALID_INPUT, "No fields to update", 400);
    }

    values.push(studentId, schoolId);
    const query = `
      UPDATE students 
      SET ${fields.join(", ")}
      WHERE id = $${paramCount++} AND school_id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Student not found", 404);
    }

    return result.rows[0];
  }

  async deleteStudent(studentId, schoolId) {
    const query = `
      UPDATE students 
      SET status = 'inactive'
      WHERE id = $1 AND school_id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [studentId, schoolId]);

    if (result.rows.length === 0) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Student not found", 404);
    }

    return result.rows[0];
  }

  // [NEW] Get comprehensive student history across all academic years
  async getStudentHistory(studentId, schoolId) {
    // Verify student exists
    const studentQuery = `
      SELECT s.*, c.name as class_name, c.section as class_section,
             u.full_name as parent_name, u.email as parent_email, u.phone as parent_phone
      FROM students s
      LEFT JOIN classes c ON s.current_class_id = c.id
      LEFT JOIN users u ON s.parent_id = u.id
      WHERE s.id = $1 AND s.school_id = $2
    `;
    const studentResult = await pool.query(studentQuery, [studentId, schoolId]);

    if (studentResult.rows.length === 0) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Student not found", 404);
    }

    const student = studentResult.rows[0];

    // Get enrollment history (which classes student was in across years)
    const enrollmentsQuery = `
      SELECT DISTINCT ON (ay.id)
        ay.id as academic_year_id,
        ay.year_name as academic_year_name,
        c.id as class_id,
        c.name as class_name,
        c.section as class_section,
        ay.is_current
      FROM classes c
      LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
      LEFT JOIN student_promotions sp ON sp.to_class_id = c.id AND sp.student_id = $1
      WHERE c.school_id = $2
        AND (
          c.id IN (SELECT to_class_id FROM student_promotions WHERE student_id = $1)
          OR c.id = $3
        )
      ORDER BY ay.id DESC
    `;
    const enrollmentsResult = await pool.query(enrollmentsQuery, [studentId, schoolId, student.current_class_id]);

    // Also include current class if not in promotions
    const enrollments = enrollmentsResult.rows;
    const hasCurrentClass = enrollments.some(e => e.is_current);
    if (!hasCurrentClass && student.current_class_id) {
      const currentClassQuery = `
        SELECT c.id as class_id, c.name as class_name, c.section as class_section,
               ay.id as academic_year_id, ay.year_name as academic_year_name, ay.is_current
        FROM classes c
        LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
        WHERE c.id = $1
      `;
      const currentClassResult = await pool.query(currentClassQuery, [student.current_class_id]);
      if (currentClassResult.rows.length > 0) {
        enrollments.unshift(currentClassResult.rows[0]);
      }
    }

    // Get attendance history with monthly breakdown
    const attendanceQuery = `
      SELECT 
        ay.id as academic_year_id,
        ay.year_name as academic_year_name,
        TO_CHAR(sa.attendance_date, 'Mon') as month,
        EXTRACT(YEAR FROM sa.attendance_date) as year,
        EXTRACT(MONTH FROM sa.attendance_date) as month_num,
        COUNT(*) as total_days,
        SUM(CASE WHEN sa.status = 'present' THEN 1 ELSE 0 END) as present_days,
        SUM(CASE WHEN sa.status = 'absent' THEN 1 ELSE 0 END) as absent_days,
        SUM(CASE WHEN sa.status = 'late' THEN 1 ELSE 0 END) as late_days
      FROM student_attendance sa
      LEFT JOIN classes c ON sa.class_id = c.id
      LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
      WHERE sa.student_id = $1 AND sa.school_id = $2
      GROUP BY ay.id, ay.year_name, TO_CHAR(sa.attendance_date, 'Mon'), EXTRACT(YEAR FROM sa.attendance_date), EXTRACT(MONTH FROM sa.attendance_date)
      ORDER BY EXTRACT(YEAR FROM sa.attendance_date) DESC, EXTRACT(MONTH FROM sa.attendance_date) ASC
    `;
    const attendanceResult = await pool.query(attendanceQuery, [studentId, schoolId]);

    // Group attendance by academic year
    const attendanceByYear = {};
    attendanceResult.rows.forEach(row => {
      if (!attendanceByYear[row.academic_year_id]) {
        attendanceByYear[row.academic_year_id] = {
          academic_year_id: row.academic_year_id,
          academic_year_name: row.academic_year_name,
          total_days: 0,
          present: 0,
          absent: 0,
          late: 0,
          monthly_breakdown: []
        };
      }
      attendanceByYear[row.academic_year_id].total_days += parseInt(row.total_days) || 0;
      attendanceByYear[row.academic_year_id].present += parseInt(row.present_days) || 0;
      attendanceByYear[row.academic_year_id].absent += parseInt(row.absent_days) || 0;
      attendanceByYear[row.academic_year_id].late += parseInt(row.late_days) || 0;
      attendanceByYear[row.academic_year_id].monthly_breakdown.push({
        month: row.month,
        year: parseInt(row.year),
        present: parseInt(row.present_days) || 0,
        total: parseInt(row.total_days) || 0,
        percentage: row.total_days > 0 
          ? Math.round((parseInt(row.present_days) || 0) / parseInt(row.total_days) * 100) 
          : 0
      });
    });

    // Get results history by year
    const resultsQuery = `
      SELECT 
        ay.id as academic_year_id,
        ay.year_name as academic_year_name,
        COUNT(DISTINCT es.exam_id) as exams_taken,
        AVG(er.marks_obtained) as average_marks,
        MAX(er.marks_obtained) as highest_marks,
        MIN(er.marks_obtained) as lowest_marks,
        CASE 
          WHEN COUNT(*) = COUNT(CASE WHEN er.marks_obtained >= (es.max_marks * 0.35) THEN 1 END) THEN 'passed'
          WHEN COUNT(CASE WHEN er.marks_obtained >= (es.max_marks * 0.35) THEN 1 END) > 0 THEN 'partial'
          ELSE 'failed'
        END as status
      FROM exam_results er
      LEFT JOIN exam_subjects es ON er.exam_subject_id = es.id
      LEFT JOIN exams e ON es.exam_id = e.id
      LEFT JOIN academic_years ay ON e.academic_year_id = ay.id
      WHERE er.student_id = $1 AND er.school_id = $2
      GROUP BY ay.id, ay.year_name
      ORDER BY ay.id DESC
    `;
    const resultsResult = await pool.query(resultsQuery, [studentId, schoolId]);

    // Get fee history by year
    const feesQuery = `
      SELECT 
        ay.id as academic_year_id,
        ay.year_name as academic_year_name,
        SUM(ft.amount_due) as total_amount,
        SUM(ft.amount_paid) as paid_amount,
        SUM(ft.amount_due - ft.amount_paid) as pending_amount,
        CASE
          WHEN SUM(ft.amount_due) = SUM(ft.amount_paid) THEN 'paid'
          WHEN SUM(ft.amount_paid) > 0 THEN 'partial'
          ELSE 'pending'
        END as status
      FROM fee_transactions ft
      LEFT JOIN academic_years ay ON ft.academic_year_id = ay.id
      WHERE ft.student_id = $1 AND ft.school_id = $2
      GROUP BY ay.id, ay.year_name
      ORDER BY ay.id DESC
    `;
    const feesResult = await pool.query(feesQuery, [studentId, schoolId]);

    return {
      student: {
        id: student.id,
        admission_number: student.admission_number,
        full_name: student.full_name,
        date_of_birth: student.date_of_birth,
        gender: student.gender,
        phone: student.phone,
        status: student.status,
        class_name: student.class_name,
        class_section: student.class_section,
        parent_name: student.parent_name,
        parent_email: student.parent_email,
        parent_phone: student.parent_phone
      },
      enrollments: enrollments.map(e => ({
        academic_year_id: e.academic_year_id,
        academic_year_name: e.academic_year_name,
        class_id: e.class_id,
        class_name: e.class_name,
        class_section: e.class_section,
        is_current: e.is_current
      })),
      attendance: Object.values(attendanceByYear).map(a => ({
        ...a,
        percentage: a.total_days > 0 ? Math.round((a.present / a.total_days) * 100) : 0
      })),
      results: resultsResult.rows.map(r => ({
        academic_year_id: r.academic_year_id,
        academic_year_name: r.academic_year_name,
        exams_taken: parseInt(r.exams_taken) || 0,
        average_marks: parseFloat(r.average_marks) || 0,
        highest_marks: parseFloat(r.highest_marks) || 0,
        lowest_marks: parseFloat(r.lowest_marks) || 0,
        status: r.status
      })),
      fees: feesResult.rows.map(f => ({
        academic_year_id: f.academic_year_id,
        academic_year_name: f.academic_year_name,
        total_amount: parseFloat(f.total_amount) || 0,
        paid_amount: parseFloat(f.paid_amount) || 0,
        pending_amount: parseFloat(f.pending_amount) || 0,
        status: f.status
      }))
    };
  }
}

module.exports = new StudentsService();
