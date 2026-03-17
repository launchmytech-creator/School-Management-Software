const pool = require("../../database/connection");
const { ERROR_CODES } = require("../../constants");
const AppError = require("../../utils/AppError");

class FeeStructuresService {
  async createFeeStructure(feeData, schoolId) {
    const query = `
      INSERT INTO fee_structures (
        school_id, class_id, academic_year_id, fee_type, amount, term_number
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await pool.query(query, [
      schoolId,
      feeData.classId,
      feeData.academicYearId,
      feeData.feeType,
      feeData.amount,
      feeData.termNumber || null,
    ]);

    return result.rows[0];
  }

  async getFeeStructuresBySchool(schoolId, filters = {}) {
    let query = `
      SELECT fs.*, 
             c.name as class_name, c.section as class_section,
             ay.year_name as academic_year_name
      FROM fee_structures fs
      LEFT JOIN classes c ON fs.class_id = c.id
      LEFT JOIN academic_years ay ON fs.academic_year_id = ay.id
      WHERE fs.school_id = $1
    `;

    const params = [schoolId];
    let paramCount = 2;

    if (filters.classId) {
      query += ` AND fs.class_id = $${paramCount++}`;
      params.push(filters.classId);
    }

    if (filters.academicYearId) {
      query += ` AND fs.academic_year_id = $${paramCount++}`;
      params.push(filters.academicYearId);
    }

    if (filters.feeType) {
      query += ` AND fs.fee_type = $${paramCount++}`;
      params.push(filters.feeType);
    }

    query += ` ORDER BY ay.start_date DESC, c.name, fs.term_number`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getFeeStructureById(feeStructureId, schoolId) {
    const query = `
      SELECT fs.*, 
             c.name as class_name, c.section as class_section,
             ay.year_name as academic_year_name
      FROM fee_structures fs
      LEFT JOIN classes c ON fs.class_id = c.id
      LEFT JOIN academic_years ay ON fs.academic_year_id = ay.id
      WHERE fs.id = $1 AND fs.school_id = $2
    `;

    const result = await pool.query(query, [feeStructureId, schoolId]);

    if (result.rows.length === 0) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Fee structure not found", 404);
    }

    return result.rows[0];
  }

  async updateFeeStructure(feeStructureId, updateData, schoolId) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updateData.amount !== undefined) {
      fields.push(`amount = $${paramCount++}`);
      values.push(updateData.amount);
    }
    if (updateData.feeType !== undefined) {
      fields.push(`fee_type = $${paramCount++}`);
      values.push(updateData.feeType);
    }

    if (fields.length === 0) {
      throw new AppError(ERROR_CODES.INVALID_INPUT, "No fields to update", 400);
    }

    values.push(feeStructureId, schoolId);
    const query = `
      UPDATE fee_structures 
      SET ${fields.join(", ")}
      WHERE id = $${paramCount++} AND school_id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Fee structure not found", 404);
    }

    return result.rows[0];
  }

  async deleteFeeStructure(feeStructureId, schoolId) {
    const query = `
      DELETE FROM fee_structures 
      WHERE id = $1 AND school_id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [feeStructureId, schoolId]);

    if (result.rows.length === 0) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Fee structure not found", 404);
    }

    return result.rows[0];
  }
}

module.exports = new FeeStructuresService();
