const pool = require("../../database/connection");
const { ERROR_CODES } = require("../../constants");
const AppError = require("../../utils/AppError");

class HolidaysService {
  async createHoliday(holidayData, schoolId, createdBy) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const holidayQuery = `
        INSERT INTO holidays (
          school_id, holiday_date, description, academic_year_id
        )
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;

      const holidayResult = await client.query(holidayQuery, [
        schoolId,
        holidayData.holidayDate,
        holidayData.description || null,
        holidayData.academicYearId,
      ]);

      const holiday = holidayResult.rows[0];

      const title = `Holiday Notice: ${holidayData.description || 'Holiday'}`;
      const formattedDate = new Date(holidayData.holidayDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const message = `${holidayData.description || 'Holiday'} - School will remain closed on ${formattedDate}.`;

      await client.query(`
        INSERT INTO announcements (school_id, title, message, target_role, created_by)
        VALUES ($1, $2, $3, NULL, $4)
      `, [schoolId, title, message, createdBy]);

      await client.query("COMMIT");

      return holiday;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async getHolidaysBySchool(schoolId, filters = {}) {
    let query = `
      SELECT h.*, 
             ay.year_name as academic_year_name
      FROM holidays h
      LEFT JOIN academic_years ay ON h.academic_year_id = ay.id
      WHERE h.school_id = $1
    `;

    const params = [schoolId];
    let paramCount = 2;

    if (filters.academicYearId) {
      query += ` AND h.academic_year_id = $${paramCount++}`;
      params.push(filters.academicYearId);
    }

    if (filters.startDate && filters.endDate) {
      query += ` AND h.holiday_date BETWEEN $${paramCount++} AND $${paramCount++}`;
      params.push(filters.startDate, filters.endDate);
    }

    query += ` ORDER BY h.holiday_date DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getHolidayById(holidayId, schoolId) {
    const query = `
      SELECT h.*, 
             ay.year_name as academic_year_name
      FROM holidays h
      LEFT JOIN academic_years ay ON h.academic_year_id = ay.id
      WHERE h.id = $1 AND h.school_id = $2
    `;

    const result = await pool.query(query, [holidayId, schoolId]);

    if (result.rows.length === 0) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Holiday not found", 404);
    }

    return result.rows[0];
  }

  async updateHoliday(holidayId, updateData, schoolId) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updateData.holidayDate !== undefined) {
      fields.push(`holiday_date = $${paramCount++}`);
      values.push(updateData.holidayDate);
    }
    if (updateData.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(updateData.description);
    }

    if (fields.length === 0) {
      throw new AppError(ERROR_CODES.INVALID_INPUT, "No fields to update", 400);
    }

    values.push(holidayId, schoolId);
    const query = `
      UPDATE holidays 
      SET ${fields.join(", ")}
      WHERE id = $${paramCount++} AND school_id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Holiday not found", 404);
    }

    return result.rows[0];
  }

  async deleteHoliday(holidayId, schoolId, deletedBy) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const getHolidayQuery = `
        SELECT * FROM holidays WHERE id = $1 AND school_id = $2
      `;
      const holidayResult = await client.query(getHolidayQuery, [holidayId, schoolId]);

      if (holidayResult.rows.length === 0) {
        throw new AppError(ERROR_CODES.NOT_FOUND, "Holiday not found", 404);
      }

      const holiday = holidayResult.rows[0];

      const deleteQuery = `
        DELETE FROM holidays 
        WHERE id = $1 AND school_id = $2
        RETURNING *
      `;

      await client.query(deleteQuery, [holidayId, schoolId]);

      const title = `Holiday Cancelled: ${holiday.description || 'Holiday'}`;
      const formattedDate = new Date(holiday.holiday_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const message = `Previously announced holiday for ${formattedDate}${holiday.description ? ` (${holiday.description})` : ''} has been cancelled. School will be open on this day.`;

      await client.query(`
        INSERT INTO announcements (school_id, title, message, target_role, created_by)
        VALUES ($1, $2, $3, NULL, $4)
      `, [schoolId, title, message, deletedBy]);

      await client.query("COMMIT");

      return holiday;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async getWorkingDaysCount(
    schoolId,
    startDate,
    endDate,
    academicYearId = null,
  ) {
    let query = `
      SELECT COUNT(*) as working_days
      FROM generate_series($1::date, $2::date, '1 day'::interval) AS date
      WHERE EXTRACT(DOW FROM date) NOT IN (0)
        AND date NOT IN (
          SELECT holiday_date 
          FROM holidays 
          WHERE school_id = $3
    `;

    const params = [startDate, endDate, schoolId];

    if (academicYearId) {
      query += ` AND academic_year_id = $4`;
      params.push(academicYearId);
    }

    query += `)`;

    const result = await pool.query(query, params);
    return result.rows[0];
  }
}

module.exports = new HolidaysService();
