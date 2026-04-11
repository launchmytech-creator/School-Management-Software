const pool = require("../../database/connection");
const { ERROR_CODES } = require("../../constants");
const AppError = require("../../utils/AppError");

class ReportsService {
  async getAttendanceReport(schoolId, filters = {}) {
    let params = [schoolId];
    let paramCount = 1;

    let classFilter = "";
    if (filters.classId) {
      classFilter = ` AND sa.class_id = $${paramCount++}`;
      params.push(filters.classId);
    }

    let yearFilter = "";
    if (filters.academicYearId) {
      yearFilter = ` AND ay.id = $${paramCount++}`;
      params.push(filters.academicYearId);
    }

    let dateFilter = "";
    if (filters.startDate && filters.endDate) {
      dateFilter = ` AND sa.date BETWEEN $${paramCount++} AND $${paramCount++}`;
      params.push(filters.startDate, filters.endDate);
    }

    const query = `
      SELECT 
        c.name as class_name,
        c.section as class_section,
        COUNT(DISTINCT sa.student_id) as total_students,
        SUM(CASE WHEN sa.status = 'present' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN sa.status = 'absent' THEN 1 ELSE 0 END) as absent_count,
        SUM(CASE WHEN sa.status = 'late' THEN 1 ELSE 0 END) as late_count,
        ROUND(
          (SUM(CASE WHEN sa.status = 'present' THEN 1 ELSE 0 END)::decimal / 
          NULLIF(COUNT(*), 0) * 100), 2
        ) as attendance_percentage
      FROM student_attendance sa
      LEFT JOIN classes c ON sa.class_id = c.id
      LEFT JOIN academic_years ay ON sa.academic_year_id = ay.id
      WHERE sa.school_id = $1 ${classFilter} ${yearFilter} ${dateFilter}
      GROUP BY c.id, c.name, c.section
      ORDER BY c.name, c.section
    `;

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getFeesReport(schoolId, filters = {}) {
    let params = [schoolId];
    let paramCount = 1;

    let classFilter = "";
    if (filters.classId) {
      classFilter = ` AND ft.class_id = $${paramCount++}`;
      params.push(filters.classId);
    }

    let yearFilter = "";
    if (filters.academicYearId) {
      yearFilter = ` AND ft.academic_year_id = $${paramCount++}`;
      params.push(filters.academicYearId);
    }

    const query = `
      SELECT 
        c.name as class_name,
        c.section as class_section,
        COUNT(DISTINCT ft.student_id) as total_students,
        SUM(ft.total_amount) as total_amount,
        SUM(ft.paid_amount) as paid_amount,
        SUM(ft.total_amount - ft.paid_amount) as pending_amount,
        COUNT(CASE WHEN ft.status = 'paid' THEN 1 END) as paid_count,
        COUNT(CASE WHEN ft.status = 'partial' THEN 1 END) as partial_count,
        COUNT(CASE WHEN ft.status = 'pending' THEN 1 END) as pending_count,
        ROUND(
          (SUM(ft.paid_amount)::decimal / NULLIF(SUM(ft.total_amount), 0) * 100), 2
        ) as collection_percentage
      FROM fee_transactions ft
      LEFT JOIN classes c ON ft.class_id = c.id
      WHERE ft.school_id = $1 ${classFilter} ${yearFilter}
      GROUP BY c.id, c.name, c.section
      ORDER BY c.name, c.section
    `;

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getResultsReport(schoolId, filters = {}) {
    let params = [schoolId];
    let paramCount = 1;

    let classFilter = "";
    if (filters.classId) {
      classFilter = ` AND er.class_id = $${paramCount++}`;
      params.push(filters.classId);
    }

    let yearFilter = "";
    if (filters.academicYearId) {
      yearFilter = ` AND er.academic_year_id = $${paramCount++}`;
      params.push(filters.academicYearId);
    }

    const query = `
      SELECT 
        c.name as class_name,
        c.section as class_section,
        s.name as subject_name,
        e.name as exam_name,
        COUNT(DISTINCT er.student_id) as students_appeared,
        AVG(er.marks_obtained) as average_marks,
        MAX(er.marks_obtained) as highest_marks,
        MIN(er.marks_obtained) as lowest_marks,
        COUNT(CASE WHEN er.marks_obtained >= (es.max_marks * 0.9) THEN 1 END) as distinction_count,
        COUNT(CASE WHEN er.marks_obtained >= (es.max_marks * 0.6) AND er.marks_obtained < (es.max_marks * 0.9) THEN 1 END) as first_class_count,
        COUNT(CASE WHEN er.marks_obtained >= (es.max_marks * 0.35) AND er.marks_obtained < (es.max_marks * 0.6) THEN 1 END) as pass_count,
        COUNT(CASE WHEN er.marks_obtained < (es.max_marks * 0.35) THEN 1 END) as fail_count
      FROM exam_results er
      LEFT JOIN classes c ON er.class_id = c.id
      LEFT JOIN exams e ON er.exam_id = e.id
      LEFT JOIN exam_subjects es ON er.exam_subject_id = es.id
      WHERE er.school_id = $1 ${classFilter} ${yearFilter}
      GROUP BY c.id, c.name, c.section, s.id, s.name, e.id, e.name
      ORDER BY c.name, c.section, s.name, e.name
    `;

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getSummaryReport(schoolId, filters = {}) {
    let params = [schoolId];
    let paramCount = 1;

    let yearFilter = "";
    if (filters.academicYearId) {
      yearFilter = ` AND ay.id = $${paramCount++}`;
      params.push(filters.academicYearId);
    }

    const studentsQuery = `
      SELECT COUNT(*) as total_students
      FROM students s
      WHERE s.school_id = $1 ${yearFilter ? `AND s.academic_year_id = $2` : ''}
    `;

    const teachersQuery = `
      SELECT COUNT(*) as total_teachers
      FROM users u
      WHERE u.school_id = $1 AND u.role = 'teacher'
    `;

    const classesQuery = `
      SELECT COUNT(*) as total_classes
      FROM classes c
      WHERE c.school_id = $1
    `;

    const [students, teachers, classes] = await Promise.all([
      pool.query(studentsQuery, params),
      pool.query(teachersQuery, [schoolId]),
      pool.query(classesQuery, [schoolId]),
    ]);

    return {
      totalStudents: parseInt(students.rows[0]?.total_students || 0),
      totalTeachers: parseInt(teachers.rows[0]?.total_teachers || 0),
      totalClasses: parseInt(classes.rows[0]?.total_classes || 0),
    };
  }
}

module.exports = new ReportsService();
