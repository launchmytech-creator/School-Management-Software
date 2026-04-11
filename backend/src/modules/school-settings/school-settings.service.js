const pool = require("../../database/connection");
const { ERROR_CODES } = require("../../constants");
const AppError = require("../../utils/AppError");

class SchoolSettingsService {
  async getSettings(schoolId) {
    let query = `
      SELECT * FROM school_settings WHERE school_id = $1
    `;

    let result = await pool.query(query, [schoolId]);

    if (result.rows.length === 0) {
      const insertQuery = `
        INSERT INTO school_settings (school_id) VALUES ($1) RETURNING *
      `;
      result = await pool.query(insertQuery, [schoolId]);
    }

    return result.rows[0];
  }

  async updateSettings(schoolId, updateData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updateData.schoolName !== undefined) {
      fields.push(`school_name = $${paramCount++}`);
      values.push(updateData.schoolName);
    }
    if (updateData.contactEmail !== undefined) {
      fields.push(`contact_email = $${paramCount++}`);
      values.push(updateData.contactEmail);
    }
    if (updateData.contactPhone !== undefined) {
      fields.push(`contact_phone = $${paramCount++}`);
      values.push(updateData.contactPhone);
    }
    if (updateData.address !== undefined) {
      fields.push(`address = $${paramCount++}`);
      values.push(updateData.address);
    }
    if (updateData.logoUrl !== undefined) {
      fields.push(`logo_url = $${paramCount++}`);
      values.push(updateData.logoUrl);
    }
    if (updateData.gradingSystem !== undefined) {
      fields.push(`grading_system = $${paramCount++}`);
      values.push(JSON.stringify(updateData.gradingSystem));
    }
    if (updateData.attendancePolicy !== undefined) {
      fields.push(`attendance_policy = $${paramCount++}`);
      values.push(JSON.stringify(updateData.attendancePolicy));
    }
    if (updateData.termStructure !== undefined) {
      fields.push(`term_structure = $${paramCount++}`);
      values.push(JSON.stringify(updateData.termStructure));
    }
    if (updateData.workingDays !== undefined) {
      fields.push(`working_days = $${paramCount++}`);
      values.push(JSON.stringify(updateData.workingDays));
    }
    if (updateData.examPolicy !== undefined) {
      fields.push(`exam_policy = $${paramCount++}`);
      values.push(JSON.stringify(updateData.examPolicy));
    }

    if (fields.length === 0) {
      throw new AppError(ERROR_CODES.INVALID_INPUT, "No fields to update", 400);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);

    values.push(schoolId);
    const query = `
      UPDATE school_settings 
      SET ${fields.join(", ")}
      WHERE school_id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "School settings not found", 404);
    }

    return result.rows[0];
  }
}

module.exports = new SchoolSettingsService();
