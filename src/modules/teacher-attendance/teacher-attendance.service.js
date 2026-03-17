const pool = require("../../database/connection");
const { ERROR_CODES } = require("../../constants");
const AppError = require("../../utils/AppError");

class TeacherAttendanceService {
  async markAttendance(attendanceData, schoolId) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const records = [];

      for (const record of attendanceData.records) {
        // Check if attendance already exists
        const existingQuery = await client.query(
          "SELECT id FROM teacher_attendance WHERE teacher_id = $1 AND attendance_date = $2",
          [record.teacherId, attendanceData.attendanceDate],
        );

        if (existingQuery.rows.length > 0) {
          // Update existing record
          const updateQuery = `
            UPDATE teacher_attendance 
            SET status = $1
            WHERE teacher_id = $2 AND attendance_date = $3
            RETURNING *
          `;
          const result = await client.query(updateQuery, [
            record.status,
            record.teacherId,
            attendanceData.attendanceDate,
          ]);
          records.push(result.rows[0]);
        } else {
          // Insert new record
          const insertQuery = `
            INSERT INTO teacher_attendance (
              school_id, teacher_id, attendance_date, status
            )
            VALUES ($1, $2, $3, $4)
            RETURNING *
          `;
          const result = await client.query(insertQuery, [
            schoolId,
            record.teacherId,
            attendanceData.attendanceDate,
            record.status,
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

  async getAttendanceBySchool(schoolId, filters = {}) {
    let query = `
      SELECT ta.*, 
             u.full_name as teacher_name, u.email as teacher_email
      FROM teacher_attendance ta
      LEFT JOIN users u ON ta.teacher_id = u.id
      WHERE ta.school_id = $1
    `;

    const params = [schoolId];
    let paramCount = 2;

    if (filters.teacherId) {
      query += ` AND ta.teacher_id = $${paramCount++}`;
      params.push(filters.teacherId);
    }

    if (filters.attendanceDate) {
      query += ` AND ta.attendance_date = $${paramCount++}`;
      params.push(filters.attendanceDate);
    }

    if (filters.startDate && filters.endDate) {
      query += ` AND ta.attendance_date BETWEEN $${paramCount++} AND $${paramCount++}`;
      params.push(filters.startDate, filters.endDate);
    }

    if (filters.status) {
      query += ` AND ta.status = $${paramCount++}`;
      params.push(filters.status);
    }

    query += ` ORDER BY ta.attendance_date DESC, u.full_name`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getTeacherAttendanceSummary(teacherId, schoolId, filters = {}) {
    let query = `
      SELECT 
        COUNT(*) FILTER (WHERE status = 'present') as present_days,
        COUNT(*) FILTER (WHERE status = 'absent') as absent_days,
        COUNT(*) FILTER (WHERE status = 'late') as late_days,
        COUNT(*) as total_marked_days
      FROM teacher_attendance
      WHERE teacher_id = $1 AND school_id = $2
    `;

    const params = [teacherId, schoolId];
    let paramCount = 3;

    if (filters.startDate && filters.endDate) {
      query += ` AND attendance_date BETWEEN $${paramCount++} AND $${paramCount++}`;
      params.push(filters.startDate, filters.endDate);
    }

    const result = await pool.query(query, params);
    return result.rows[0];
  }

  async getAttendanceByDate(attendanceDate, schoolId) {
    const query = `
      SELECT ta.*, 
             u.full_name as teacher_name, u.email as teacher_email, u.phone as teacher_phone
      FROM teacher_attendance ta
      LEFT JOIN users u ON ta.teacher_id = u.id
      WHERE ta.attendance_date = $1 AND ta.school_id = $2
      ORDER BY u.full_name
    `;

    const result = await pool.query(query, [attendanceDate, schoolId]);
    return result.rows;
  }

  async deleteAttendance(attendanceId, schoolId) {
    const query = `
      DELETE FROM teacher_attendance 
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

module.exports = new TeacherAttendanceService();
