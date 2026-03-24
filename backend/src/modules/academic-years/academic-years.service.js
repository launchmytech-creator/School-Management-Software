const pool = require("../../database/connection");
const { ERROR_CODES } = require("../../constants");
const AppError = require("../../utils/AppError");

class AcademicYearsService {
  async createAcademicYear(yearData, schoolId) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // If this is set as current, unset other current years
      if (yearData.isCurrent) {
        await client.query(
          "UPDATE academic_years SET is_current = false WHERE school_id = $1",
          [schoolId],
        );
      }

      const query = `
        INSERT INTO academic_years (
          school_id, year_name, start_date, end_date, is_current
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;

      const result = await client.query(query, [
        schoolId,
        yearData.yearName,
        yearData.startDate,
        yearData.endDate,
        yearData.isCurrent || false,
      ]);

      await client.query("COMMIT");
      return result.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async getAcademicYearsBySchool(schoolId) {
    const query = `
      SELECT ay.*, 
             COUNT(DISTINCT c.id) as class_count
      FROM academic_years ay
      LEFT JOIN classes c ON ay.id = c.academic_year_id
      WHERE ay.school_id = $1
      GROUP BY ay.id
      ORDER BY ay.start_date DESC
    `;

    const result = await pool.query(query, [schoolId]);
    return result.rows;
  }

  async getAcademicYearById(yearId, schoolId) {
    const query = `
      SELECT ay.*, 
             COUNT(DISTINCT c.id) as class_count
      FROM academic_years ay
      LEFT JOIN classes c ON ay.id = c.academic_year_id
      WHERE ay.id = $1 AND ay.school_id = $2
      GROUP BY ay.id
    `;

    const result = await pool.query(query, [yearId, schoolId]);

    if (result.rows.length === 0) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Academic year not found", 404);
    }

    return result.rows[0];
  }

  async getCurrentAcademicYear(schoolId) {
    const query = `
      SELECT * FROM academic_years 
      WHERE school_id = $1 AND is_current = true
    `;

    const result = await pool.query(query, [schoolId]);

    if (result.rows.length === 0) {
      throw new AppError(
        ERROR_CODES.NOT_FOUND,
        "No current academic year set",
        404,
      );
    }

    return result.rows[0];
  }

  async updateAcademicYear(yearId, updateData, schoolId) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // If setting as current, unset other current years
      if (updateData.isCurrent === true) {
        await client.query(
          "UPDATE academic_years SET is_current = false WHERE school_id = $1 AND id != $2",
          [schoolId, yearId],
        );
      }

      const fields = [];
      const values = [];
      let paramCount = 1;

      if (updateData.yearName !== undefined) {
        fields.push(`year_name = $${paramCount++}`);
        values.push(updateData.yearName);
      }
      if (updateData.startDate !== undefined) {
        fields.push(`start_date = $${paramCount++}`);
        values.push(updateData.startDate);
      }
      if (updateData.endDate !== undefined) {
        fields.push(`end_date = $${paramCount++}`);
        values.push(updateData.endDate);
      }
      if (updateData.isCurrent !== undefined) {
        fields.push(`is_current = $${paramCount++}`);
        values.push(updateData.isCurrent);
      }

      if (fields.length === 0) {
        throw new AppError(
          ERROR_CODES.INVALID_INPUT,
          "No fields to update",
          400,
        );
      }

      values.push(yearId, schoolId);
      const query = `
        UPDATE academic_years 
        SET ${fields.join(", ")}
        WHERE id = $${paramCount++} AND school_id = $${paramCount}
        RETURNING *
      `;

      const result = await client.query(query, values);

      if (result.rows.length === 0) {
        throw new AppError(
          ERROR_CODES.NOT_FOUND,
          "Academic year not found",
          404,
        );
      }

      await client.query("COMMIT");
      return result.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async setCurrentAcademicYear(yearId, schoolId) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Unset all current years
      await client.query(
        "UPDATE academic_years SET is_current = false WHERE school_id = $1",
        [schoolId],
      );

      // Set the specified year as current
      const result = await client.query(
        "UPDATE academic_years SET is_current = true WHERE id = $1 AND school_id = $2 RETURNING *",
        [yearId, schoolId],
      );

      if (result.rows.length === 0) {
        throw new AppError(
          ERROR_CODES.NOT_FOUND,
          "Academic year not found",
          404,
        );
      }

      await client.query("COMMIT");
      return result.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteAcademicYear(yearId, schoolId) {
    const query = `
      DELETE FROM academic_years 
      WHERE id = $1 AND school_id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [yearId, schoolId]);

    if (result.rows.length === 0) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Academic year not found", 404);
    }

    return result.rows[0];
  }
}

module.exports = new AcademicYearsService();
