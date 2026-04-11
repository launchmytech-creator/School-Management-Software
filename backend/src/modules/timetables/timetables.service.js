const pool = require("../../database/connection");
const { ERROR_CODES } = require("../../constants");
const AppError = require("../../utils/AppError");

class TimetablesService {
  async createTimetableEntry(timetableData, schoolId) {
    const checkQuery = `
      SELECT id FROM timetables 
      WHERE class_id = $1 AND academic_year_id = $2 AND day_of_week = $3 AND period_number = $4
    `;
    const existing = await pool.query(checkQuery, [
      timetableData.classId,
      timetableData.academicYearId,
      timetableData.dayOfWeek,
      timetableData.periodNumber,
    ]);

    if (existing.rows.length > 0) {
      throw new AppError(ERROR_CODES.CONFLICT, "Timetable entry already exists for this slot", 409);
    }

    const query = `
      INSERT INTO timetables (
        school_id, class_id, academic_year_id, day_of_week, period_number,
        subject_id, teacher_id, start_time, end_time, room
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const result = await pool.query(query, [
      schoolId,
      timetableData.classId,
      timetableData.academicYearId,
      timetableData.dayOfWeek,
      timetableData.periodNumber,
      timetableData.subjectId || null,
      timetableData.teacherId || null,
      timetableData.startTime,
      timetableData.endTime,
      timetableData.room || null,
    ]);

    return result.rows[0];
  }

  async getTimetables(schoolId, filters = {}) {
    let query = `
      SELECT t.*, 
             c.name as class_name,
             c.section as class_section,
             s.name as subject_name,
             s.code as subject_code,
             u.full_name as teacher_name,
             ay.year_name as academic_year_name
      FROM timetables t
      LEFT JOIN classes c ON t.class_id = c.id
      LEFT JOIN subjects s ON t.subject_id = s.id
      LEFT JOIN users u ON t.teacher_id = u.id
      LEFT JOIN academic_years ay ON t.academic_year_id = ay.id
      WHERE t.school_id = $1
    `;

    const params = [schoolId];
    let paramCount = 2;

    if (filters.classId) {
      query += ` AND t.class_id = $${paramCount++}`;
      params.push(filters.classId);
    }

    if (filters.academicYearId) {
      query += ` AND t.academic_year_id = $${paramCount++}`;
      params.push(filters.academicYearId);
    }

    if (filters.dayOfWeek !== undefined) {
      query += ` AND t.day_of_week = $${paramCount++}`;
      params.push(filters.dayOfWeek);
    }

    if (filters.teacherId) {
      query += ` AND t.teacher_id = $${paramCount++}`;
      params.push(filters.teacherId);
    }

    if (filters.isActive !== undefined) {
      query += ` AND t.is_active = $${paramCount++}`;
      params.push(filters.isActive);
    }

    query += ` ORDER BY t.day_of_week, t.period_number, t.start_time`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getTimetableById(timetableId, schoolId) {
    const query = `
      SELECT t.*, 
             c.name as class_name,
             c.section as class_section,
             s.name as subject_name,
             s.code as subject_code,
             u.full_name as teacher_name,
             ay.year_name as academic_year_name
      FROM timetables t
      LEFT JOIN classes c ON t.class_id = c.id
      LEFT JOIN subjects s ON t.subject_id = s.id
      LEFT JOIN users u ON t.teacher_id = u.id
      LEFT JOIN academic_years ay ON t.academic_year_id = ay.id
      WHERE t.id = $1 AND t.school_id = $2
    `;

    const result = await pool.query(query, [timetableId, schoolId]);

    if (result.rows.length === 0) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Timetable entry not found", 404);
    }

    return result.rows[0];
  }

  async updateTimetable(timetableId, updateData, schoolId) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updateData.subjectId !== undefined) {
      fields.push(`subject_id = $${paramCount++}`);
      values.push(updateData.subjectId);
    }
    if (updateData.teacherId !== undefined) {
      fields.push(`teacher_id = $${paramCount++}`);
      values.push(updateData.teacherId);
    }
    if (updateData.startTime !== undefined) {
      fields.push(`start_time = $${paramCount++}`);
      values.push(updateData.startTime);
    }
    if (updateData.endTime !== undefined) {
      fields.push(`end_time = $${paramCount++}`);
      values.push(updateData.endTime);
    }
    if (updateData.room !== undefined) {
      fields.push(`room = $${paramCount++}`);
      values.push(updateData.room);
    }
    if (updateData.isActive !== undefined) {
      fields.push(`is_active = $${paramCount++}`);
      values.push(updateData.isActive);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);

    if (fields.length === 1) {
      throw new AppError(ERROR_CODES.INVALID_INPUT, "No fields to update", 400);
    }

    values.push(timetableId, schoolId);
    const query = `
      UPDATE timetables 
      SET ${fields.join(", ")}
      WHERE id = $${paramCount++} AND school_id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Timetable entry not found", 404);
    }

    return result.rows[0];
  }

  async deleteTimetable(timetableId, schoolId) {
    const query = `
      DELETE FROM timetables 
      WHERE id = $1 AND school_id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [timetableId, schoolId]);

    if (result.rows.length === 0) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Timetable entry not found", 404);
    }

    return result.rows[0];
  }

  async bulkCreateTimetable(entries, schoolId) {
    const createdEntries = [];
    
    for (const entry of entries) {
      const created = await this.createTimetableEntry({ ...entry, schoolId }, schoolId);
      createdEntries.push(created);
    }
    
    return createdEntries;
  }
}

module.exports = new TimetablesService();
