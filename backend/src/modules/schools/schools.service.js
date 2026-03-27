const bcrypt = require("bcryptjs");
const pool = require("../../database/connection");
const { ERROR_CODES, ERROR_MESSAGES, ROLES } = require("../../constants");
const AppError = require("../../utils/AppError");

class SchoolsService {
  async createSchool(schoolData, adminData) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Create school with new schema fields
      const schoolQuery = `
        INSERT INTO schools (
          name, code, subscription_plan_id, subscription_status, 
          subscription_end_date, contact_email, 
          contact_phone, address
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const schoolResult = await client.query(schoolQuery, [
        schoolData.name,
        schoolData.code,
        schoolData.subscriptionPlanId || 1, // Default to Basic plan
        schoolData.subscriptionStatus || "trial",
        schoolData.subscriptionEndDate || null,
        schoolData.contactEmail,
        schoolData.contactPhone || null,
        schoolData.address || null,
      ]);

      const school = schoolResult.rows[0];

      // Record subscription history
      const historyQuery = `
        INSERT INTO subscription_history (school_id, plan_id, start_date)
        VALUES ($1, $2, CURRENT_DATE)
      `;
      await client.query(historyQuery, [
        school.id,
        school.subscription_plan_id,
      ]);

      // Hash admin password
      const hashedPassword = await bcrypt.hash(adminData.password, 10);

      // Create admin user with new schema (email unique per school)
      const adminQuery = `
        INSERT INTO users (school_id, role, email, password_hash, full_name, phone)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, email, full_name, role, school_id
      `;

      const adminResult = await client.query(adminQuery, [
        school.id,
        ROLES.SCHOOL_ADMIN,
        adminData.email,
        hashedPassword,
        adminData.fullName,
        adminData.phone || null,
      ]);

      await client.query("COMMIT");

      return {
        school,
        admin: adminResult.rows[0],
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async getAllSchools() {
    const query = `
      SELECT s.*, 
             sp.name as subscription_plan_name,
             sp.features as subscription_features,
             COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'teacher') as teacher_count,
             COUNT(DISTINCT st.id) as student_count
      FROM schools s
      LEFT JOIN subscription_plans sp ON s.subscription_plan_id = sp.id
      LEFT JOIN users u ON s.id = u.school_id AND u.is_active = true
      LEFT JOIN students st ON s.id = st.school_id AND st.status = 'active'
      GROUP BY s.id, sp.name, sp.features
      ORDER BY s.created_at DESC
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  async getSchoolById(schoolId) {
    const query = `
      SELECT s.*,
             sp.name as subscription_plan_name,
             sp.features as subscription_features,
             COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'teacher') as teacher_count,
             COUNT(DISTINCT st.id) as student_count
      FROM schools s
      LEFT JOIN subscription_plans sp ON s.subscription_plan_id = sp.id
      LEFT JOIN users u ON s.id = u.school_id AND u.is_active = true
      LEFT JOIN students st ON s.id = st.school_id AND st.status = 'active'
      WHERE s.id = $1
      GROUP BY s.id, sp.name, sp.features
    `;

    const result = await pool.query(query, [schoolId]);

    if (result.rows.length === 0) {
      throw new AppError(
        ERROR_CODES.SCHOOL_NOT_FOUND,
        ERROR_MESSAGES[ERROR_CODES.SCHOOL_NOT_FOUND],
        404,
      );
    }

    return result.rows[0];
  }

  async updateSchool(schoolId, updateData) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Build dynamic update query
      const fields = [];
      const values = [];
      let paramCount = 1;

      if (updateData.name !== undefined) {
        fields.push(`name = $${paramCount++}`);
        values.push(updateData.name);
      }
      if (updateData.subscriptionPlanId !== undefined) {
        // Get current plan for history
        const currentSchool = await client.query(
          "SELECT subscription_plan_id FROM schools WHERE id = $1",
          [schoolId],
        );

        if (
          currentSchool.rows[0].subscription_plan_id !==
          updateData.subscriptionPlanId
        ) {
          // Close current subscription history
          await client.query(
            "UPDATE subscription_history SET end_date = CURRENT_DATE WHERE school_id = $1 AND end_date IS NULL",
            [schoolId],
          );

          // Create new subscription history
          await client.query(
            "INSERT INTO subscription_history (school_id, plan_id, start_date) VALUES ($1, $2, CURRENT_DATE)",
            [schoolId, updateData.subscriptionPlanId],
          );
        }

        fields.push(`subscription_plan_id = $${paramCount++}`);
        values.push(updateData.subscriptionPlanId);
      }
      if (updateData.subscriptionStatus !== undefined) {
        fields.push(`subscription_status = $${paramCount++}`);
        values.push(updateData.subscriptionStatus);
      }
      if (updateData.subscriptionEndDate !== undefined) {
        fields.push(`subscription_end_date = $${paramCount++}`);
        values.push(updateData.subscriptionEndDate);
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
      if (updateData.isActive !== undefined) {
        fields.push(`is_active = $${paramCount++}`);
        values.push(updateData.isActive);
      }

      if (fields.length === 0) {
        throw new AppError(
          ERROR_CODES.INVALID_INPUT,
          "No fields to update",
          400,
        );
      }

      values.push(schoolId);
      const updateQuery = `
        UPDATE schools 
        SET ${fields.join(", ")}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await client.query(updateQuery, values);

      if (result.rows.length === 0) {
        throw new AppError(
          ERROR_CODES.SCHOOL_NOT_FOUND,
          ERROR_MESSAGES[ERROR_CODES.SCHOOL_NOT_FOUND],
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
}

module.exports = new SchoolsService();
