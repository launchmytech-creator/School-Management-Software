const pool = require("../../database/connection");
const { ERROR_CODES } = require("../../constants");
const AppError = require("../../utils/AppError");

class StudentAttendanceService {
  async markAttendance(attendanceData, schoolId, userId) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const records = [];

      for (const record of attendanceData.records) {
        // Check if attendance already exists
        const existingQuery = await client.query(
          "SELECT id FROM student_attendance WHERE student_id = $1 AND attendance_date = $2",
          [record.studentId, attendanceData.attendanceDate],
        );

        if (existingQuery.rows.length > 0) {
          // Update existing record
          const updateQuery = `
            UPDATE student_attendance 
            SET status = $1, marked_by = $2
            WHERE student_id = $3 AND attendance_date = $4
            RETURNING *
          `;
          const result = await client.query(updateQuery, [
            record.status,
            userId,
            record.studentId,
            attendanceData.attendanceDate,
          ]);
          records.push(result.rows[0]);
        } else {
          // Insert new record
          const insertQuery = `
            INSERT INTO student_attendance (
              school_id, student_id, class_id, attendance_date, status, marked_by
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
          `;
          const result = await client.query(insertQuery, [
            schoolId,
            record.studentId,
            attendanceData.classId,
            attendanceData.attendanceDate,
            record.status,
            userId,
          ]);
          records.push(result.rows[0]);
        }
      }

      await client.query("COMMIT");
      return records;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async getAttendanceBySchool(schoolId, filters = {}, caller = {}) {
    const isTeacher = caller.callerRole === "teacher";

    let query = `
      SELECT sa.*, 
             s.full_name as student_name, s.admission_number,
             c.name as class_name, c.section as class_section,
             u.full_name as marked_by_name
      FROM student_attendance sa
      LEFT JOIN students s ON sa.student_id = s.id
      LEFT JOIN classes c ON sa.class_id = c.id
      LEFT JOIN users u ON sa.marked_by = u.id
      WHERE sa.school_id = $1
    `;

    const params = [schoolId];
    let paramCount = 2;

    // Teachers can only see attendance for classes they are allocated to
    if (isTeacher) {
      query += ` AND sa.class_id IN (
        SELECT DISTINCT class_id FROM teacher_allocations
        WHERE teacher_id = $${paramCount++} AND school_id = $${paramCount++}
      )`;
      params.push(parseInt(caller.callerId), schoolId);
    }

    if (filters.classId) {
      query += ` AND sa.class_id = $${paramCount++}`;
      params.push(parseInt(filters.classId));
    }

    if (filters.studentId) {
      query += ` AND sa.student_id = $${paramCount++}`;
      params.push(parseInt(filters.studentId));
    }

    if (filters.attendanceDate) {
      query += ` AND sa.attendance_date = $${paramCount++}`;
      params.push(filters.attendanceDate);
    }

    if (filters.startDate && filters.endDate) {
      query += ` AND sa.attendance_date BETWEEN $${paramCount++} AND $${paramCount++}`;
      params.push(filters.startDate, filters.endDate);
    }

    if (filters.status) {
      query += ` AND sa.status = $${paramCount++}`;
      params.push(filters.status);
    }

    query += ` ORDER BY sa.attendance_date DESC, s.full_name`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getStudentAttendanceSummary(studentId, schoolId, filters = {}) {
    let query = `
      SELECT 
        COUNT(*) FILTER (WHERE status = 'present') as present_days,
        COUNT(*) FILTER (WHERE status = 'absent') as absent_days,
        COUNT(*) FILTER (WHERE status = 'late') as late_days,
        COUNT(*) as total_marked_days
      FROM student_attendance
      WHERE student_id = $1 AND school_id = $2
    `;

    const params = [parseInt(studentId), parseInt(schoolId)];
    let paramCount = 3;

    if (filters.startDate && filters.endDate) {
      query += ` AND attendance_date BETWEEN $${paramCount++} AND $${paramCount++}`;
      params.push(filters.startDate, filters.endDate);
    }

    const result = await pool.query(query, params);
    return result.rows[0];
  }

  async getClassAttendanceByDate(classId, attendanceDate, schoolId) {
    const query = `
      SELECT sa.*, 
             s.full_name as student_name, s.admission_number, s.roll_number
      FROM student_attendance sa
      LEFT JOIN students s ON sa.student_id = s.id
      WHERE sa.class_id = $1 AND sa.attendance_date = $2 AND sa.school_id = $3
      ORDER BY s.roll_number, s.full_name
    `;

    const result = await pool.query(query, [classId, attendanceDate, schoolId]);
    return result.rows;
  }

  async deleteAttendance(attendanceId, schoolId) {
    const query = `
      DELETE FROM student_attendance 
      WHERE id = $1 AND school_id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [attendanceId, schoolId]);

    if (result.rows.length === 0) {
      throw new AppError(
        ERROR_CODES.NOT_FOUND,
        "Attendance record not found",
        404,
      );
    }

    return result.rows[0];
  }
}

module.exports = new StudentAttendanceService();
