const pool = require("../../database/connection");
const { ERROR_CODES } = require("../../constants");
const AppError = require("../../utils/AppError");

class FeeStructuresService {
  /**
   * Create a fee component for a class.
   * Each call adds one fee type (Tuition, Transport, Exam, etc.) with its annual amount.
   * feeTerms is set once per class+year group — all components in the group share it.
   *
   * Example:
   *   POST { classId:1, academicYearId:1, feeTerms:4, feeType:"Tuition Fee",  amount:30000 }
   *   POST { classId:1, academicYearId:1, feeTerms:4, feeType:"Transport Fee", amount:10000 }
   *   POST { classId:1, academicYearId:1, feeTerms:4, feeType:"Exam Fee",      amount:5000  }
   *   POST { classId:1, academicYearId:1, feeTerms:4, feeType:"Extra Fee",     amount:5000  }
   *   Total annual = 50,000 → per term = 12,500
   *
   * feeTerms must be consistent across all components of the same class+year.
   */
  async createFeeStructure(feeData, schoolId) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Validate academic year
      const ayResult = await client.query(
        "SELECT id FROM academic_years WHERE id = $1 AND school_id = $2",
        [feeData.academicYearId, schoolId]
      );
      if (ayResult.rows.length === 0) {
        throw new AppError(ERROR_CODES.NOT_FOUND, "Academic year not found", 404);
      }

      // Check if this class+year group already has components — enforce consistent feeTerms
      const existingGroup = await client.query(
        "SELECT fee_terms FROM fee_structures WHERE school_id = $1 AND class_id = $2 AND academic_year_id = $3 LIMIT 1",
        [schoolId, feeData.classId, feeData.academicYearId]
      );
      if (existingGroup.rows.length > 0) {
        const existingFeeTerms = existingGroup.rows[0].fee_terms;
        if (existingFeeTerms !== feeData.feeTerms) {
          throw new AppError(
            ERROR_CODES.INVALID_INPUT,
            "All fee components for the same class and academic year must use the same feeTerms. " +
            "Existing feeTerms for this group: " + existingFeeTerms,
            400
          );
        }
      }

      // Check duplicate fee type in this group
      const duplicate = await client.query(
        "SELECT id FROM fee_structures WHERE school_id = $1 AND class_id = $2 AND academic_year_id = $3 AND fee_type = $4 LIMIT 1",
        [schoolId, feeData.classId, feeData.academicYearId, feeData.feeType]
      );
      if (duplicate.rows.length > 0) {
        throw new AppError(
          ERROR_CODES.INVALID_INPUT,
          "Fee type '" + feeData.feeType + "' already exists for this class and academic year",
          409
        );
      }

      // Insert the fee component (annual amount — splitting happens at transaction generation)
      const result = await client.query(
        "INSERT INTO fee_structures (school_id, class_id, academic_year_id, fee_type, amount, fee_terms) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
        [schoolId, feeData.classId, feeData.academicYearId, feeData.feeType, feeData.amount, feeData.feeTerms]
      );
      const created = result.rows[0];

      // Return the full group summary
      const groupSummary = await this._getGroupSummary(client, schoolId, feeData.classId, feeData.academicYearId);

      await client.query("COMMIT");
      return { component: created, group: groupSummary };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async _getGroupSummary(client, schoolId, classId, academicYearId) {
    const result = await client.query(
      `SELECT fs.*,
              c.name as class_name, c.section as class_section,
              ay.year_name as academic_year_name
       FROM fee_structures fs
       LEFT JOIN classes c ON fs.class_id = c.id
       LEFT JOIN academic_years ay ON fs.academic_year_id = ay.id
       WHERE fs.school_id = $1 AND fs.class_id = $2 AND fs.academic_year_id = $3
       ORDER BY fs.fee_type`,
      [schoolId, classId, academicYearId]
    );
    const components = result.rows;
    const totalAnnual = components.reduce((sum, c) => sum + parseFloat(c.amount), 0);
    const feeTerms = components.length > 0 ? components[0].fee_terms : null;
    const perTermAmount = feeTerms ? totalAnnual / feeTerms : totalAnnual;

    return {
      classId,
      academicYearId,
      className: components[0]?.class_name,
      classSection: components[0]?.class_section,
      academicYearName: components[0]?.academic_year_name,
      feeTerms,
      totalAnnualFee: totalAnnual,
      perTermAmount: Math.round(perTermAmount * 100) / 100,
      components: components.map(c => ({
        id: c.id,
        fee_type: c.fee_type,
        annual_amount: parseFloat(c.amount),
      }))
    };
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
    let p = 2;

    if (filters.classId) { query += " AND fs.class_id = $" + p++; params.push(filters.classId); }
    if (filters.academicYearId) { query += " AND fs.academic_year_id = $" + p++; params.push(filters.academicYearId); }
    if (filters.feeType) { query += " AND fs.fee_type = $" + p++; params.push(filters.feeType); }

    query += " ORDER BY ay.start_date DESC, c.name, fs.fee_type";
    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get all fee components grouped by class+year, with totals and per-term amounts.
   */
  async getFeeStructuresGrouped(schoolId, filters = {}) {
    let query = `
      SELECT fs.class_id, fs.academic_year_id, fs.fee_terms,
             c.name as class_name, c.section as class_section,
             ay.year_name as academic_year_name,
             SUM(fs.amount) as total_annual_fee,
             ROUND(SUM(fs.amount) / fs.fee_terms, 2) as per_term_amount,
             json_agg(json_build_object(
               'id', fs.id,
               'fee_type', fs.fee_type,
               'annual_amount', fs.amount
             ) ORDER BY fs.fee_type) as components
      FROM fee_structures fs
      LEFT JOIN classes c ON fs.class_id = c.id
      LEFT JOIN academic_years ay ON fs.academic_year_id = ay.id
      WHERE fs.school_id = $1
    `;
    const params = [schoolId];
    let p = 2;

    if (filters.classId) { query += " AND fs.class_id = $" + p++; params.push(filters.classId); }
    if (filters.academicYearId) { query += " AND fs.academic_year_id = $" + p++; params.push(filters.academicYearId); }

    query += " GROUP BY fs.class_id, fs.academic_year_id, fs.fee_terms, c.name, c.section, ay.year_name, ay.start_date";
    query += " ORDER BY ay.start_date DESC, c.name";

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getFeeStructureById(feeStructureId, schoolId) {
    const result = await pool.query(
      `SELECT fs.*, c.name as class_name, c.section as class_section, ay.year_name as academic_year_name
       FROM fee_structures fs
       LEFT JOIN classes c ON fs.class_id = c.id
       LEFT JOIN academic_years ay ON fs.academic_year_id = ay.id
       WHERE fs.id = $1 AND fs.school_id = $2`,
      [feeStructureId, schoolId]
    );
    if (result.rows.length === 0) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Fee structure not found", 404);
    }
    return result.rows[0];
  }

  async updateFeeStructure(feeStructureId, updateData, schoolId) {
    const fields = [];
    const values = [];
    let p = 1;

    if (updateData.amount !== undefined) { fields.push("amount = $" + p++); values.push(updateData.amount); }
    if (updateData.feeType !== undefined) { fields.push("fee_type = $" + p++); values.push(updateData.feeType); }

    if (fields.length === 0) {
      throw new AppError(ERROR_CODES.INVALID_INPUT, "No fields to update", 400);
    }

    values.push(feeStructureId, schoolId);
    const result = await pool.query(
      "UPDATE fee_structures SET " + fields.join(", ") + " WHERE id = $" + p++ + " AND school_id = $" + p + " RETURNING *",
      values
    );
    if (result.rows.length === 0) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Fee structure not found", 404);
    }
    return result.rows[0];
  }

  async deleteFeeStructure(feeStructureId, schoolId) {
    const result = await pool.query(
      "DELETE FROM fee_structures WHERE id = $1 AND school_id = $2 RETURNING *",
      [feeStructureId, schoolId]
    );
    if (result.rows.length === 0) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Fee structure not found", 404);
    }
    return result.rows[0];
  }

  /**
   * Delete all fee components for a class+year group
   */
  async deleteFeeStructureGroup(schoolId, classId, academicYearId) {
    const result = await pool.query(
      "DELETE FROM fee_structures WHERE school_id = $1 AND class_id = $2 AND academic_year_id = $3 RETURNING *",
      [schoolId, classId, academicYearId]
    );
    if (result.rows.length === 0) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "No fee structures found for this class and academic year", 404);
    }
    return { deleted: result.rows.length, records: result.rows };
  }
}

module.exports = new FeeStructuresService();
