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
          contact_phone, address, fee_terms
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      const schoolResult = await client.query(schoolQuery, [
        schoolData.name,
        schoolData.code,
        schoolData.subscriptionPlanId || 1,
        schoolData.subscriptionStatus || "trial",
        schoolData.subscriptionEndDate || null,
        schoolData.contactEmail,
        schoolData.contactPhone || null,
        schoolData.address || null,
        schoolData.feeTerms || 1,
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
      SELECT s.id, s.name, s.code, s.contact_email, s.contact_phone,
             s.address, s.is_active, s.created_at,
             s.subscription_status, s.subscription_end_date, s.subscription_plan_id,
             sp.name as subscription_plan_name,
             COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'teacher') as teacher_count,
             COUNT(DISTINCT st.id) as student_count
      FROM schools s
      LEFT JOIN subscription_plans sp ON s.subscription_plan_id = sp.id
      LEFT JOIN users u ON s.id = u.school_id AND u.is_active = true
      LEFT JOIN students st ON s.id = st.school_id AND st.status = 'active'
      GROUP BY s.id, s.name, s.code, s.contact_email, s.contact_phone,
               s.address, s.is_active, s.created_at,
               s.subscription_status, s.subscription_end_date, s.subscription_plan_id,
               sp.name
      ORDER BY s.created_at DESC
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  async getSchoolById(schoolId) {
    const query = `
      SELECT s.id, s.name, s.code, s.contact_email, s.contact_phone,
             s.address, s.is_active, s.created_at,
             s.subscription_status, s.subscription_end_date, s.subscription_plan_id,
             sp.name as subscription_plan_name,
             COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'teacher') as teacher_count,
             COUNT(DISTINCT st.id) as student_count
      FROM schools s
      LEFT JOIN subscription_plans sp ON s.subscription_plan_id = sp.id
      LEFT JOIN users u ON s.id = u.school_id AND u.is_active = true
      LEFT JOIN students st ON s.id = st.school_id AND st.status = 'active'
      WHERE s.id = $1
      GROUP BY s.id, s.name, s.code, s.contact_email, s.contact_phone,
               s.address, s.is_active, s.created_at,
               s.subscription_status, s.subscription_end_date, s.subscription_plan_id,
               sp.name
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

  // [UPDATED] Allow school admin to update own school, added school existence check
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

        if (!currentSchool.rows[0]) {
          throw new AppError(
            ERROR_CODES.SCHOOL_NOT_FOUND,
            ERROR_MESSAGES[ERROR_CODES.SCHOOL_NOT_FOUND],
            404,
          );
        }

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
      if (updateData.feeTerms !== undefined) {
        const currentSchool = await client.query(
          "SELECT fee_terms FROM schools WHERE id = $1",
          [schoolId],
        );

        if (currentSchool.rows[0] && currentSchool.rows[0].fee_terms !== updateData.feeTerms) {
          await client.query(
            "UPDATE fee_terms_history SET end_date = CURRENT_DATE WHERE school_id = $1 AND end_date IS NULL",
            [schoolId],
          );

          await client.query(
            "INSERT INTO fee_terms_history (school_id, fee_terms, start_date) VALUES ($1, $2, CURRENT_DATE)",
            [schoolId, updateData.feeTerms],
          );
        }

        fields.push(`fee_terms = $${paramCount++}`);
        values.push(updateData.feeTerms);
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

  async getSchoolAdmin(schoolId) {
    const result = await pool.query(
      `SELECT id, email, full_name, phone, role, school_id, is_active, created_at
       FROM users
       WHERE school_id = $1 AND role = $2 AND is_active = true
       LIMIT 1`,
      [schoolId, ROLES.SCHOOL_ADMIN]
    );

    if (result.rows.length === 0) {
      throw new AppError(ERROR_CODES.USER_NOT_FOUND, ERROR_MESSAGES[ERROR_CODES.USER_NOT_FOUND], 404);
    }

    return result.rows[0];
  }

  async updateSchoolAdmin(schoolId, adminData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (adminData.fullName !== undefined) {
      fields.push(`full_name = $${paramCount++}`);
      values.push(adminData.fullName);
    }
    if (adminData.email !== undefined) {
      fields.push(`email = $${paramCount++}`);
      values.push(adminData.email);
    }
    if (adminData.phone !== undefined) {
      fields.push(`phone = $${paramCount++}`);
      values.push(adminData.phone);
    }
    if (adminData.password !== undefined) {
      const hashedPassword = await bcrypt.hash(adminData.password, 10);
      fields.push(`password_hash = $${paramCount++}`);
      values.push(hashedPassword);
    }

    if (fields.length === 0) {
      throw new AppError(ERROR_CODES.INVALID_INPUT, "No fields to update", 400);
    }

    values.push(schoolId, ROLES.SCHOOL_ADMIN);
    const query = `
      UPDATE users
      SET ${fields.join(", ")}
      WHERE school_id = $${paramCount} AND role = $${paramCount + 1}
      RETURNING id, email, full_name, phone, role, school_id
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new AppError(ERROR_CODES.USER_NOT_FOUND, ERROR_MESSAGES[ERROR_CODES.USER_NOT_FOUND], 404);
    }

    return result.rows[0];
  }

  async purchaseSubscription(schoolId, data) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      
      const schoolResult = await client.query(
        "SELECT * FROM schools WHERE id = $1", [schoolId]
      );
      const school = schoolResult.rows[0];
      if (!school) {
        throw new AppError(ERROR_CODES.SCHOOL_NOT_FOUND, ERROR_MESSAGES[ERROR_CODES.SCHOOL_NOT_FOUND], 404);
      }
      
      const planResult = await client.query(
        "SELECT * FROM subscription_plans WHERE id = $1", [data.planId]
      );
      const newPlan = planResult.rows[0];
      if (!newPlan) {
        throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Invalid subscription plan", 400);
      }
      
      const allowedFeeTerms = newPlan.allowed_fee_terms || ["yearly"];
      if (!allowedFeeTerms.includes(data.feeTerm)) {
        throw new AppError(
          ERROR_CODES.VALIDATION_ERROR,
          `Fee term '${data.feeTerm}' is not allowed for ${newPlan.name} plan. Allowed: ${allowedFeeTerms.join(", ")}`,
          400
        );
      }
      
      // Derive feeTermNumeric from feeTerm string
      const feeTermMap = { 'yearly': 1, 'half-yearly': 2, 'quarterly': 4, 'monthly': 12 };
      const feeTermNumeric = feeTermMap[data.feeTerm] || 1;
      
      const currentPlanResult = await client.query(
        "SELECT * FROM subscription_plans WHERE id = $1", [school.subscription_plan_id]
      );
      const currentPlan = currentPlanResult.rows[0];

      const { isUpgrade, isDowngrade, calculateUpgradePayable, calculateEndDate } = require("../../utils/proration");
      const planChangeType = isUpgrade(currentPlan.name, newPlan.name) ? 'upgrade'
        : isDowngrade(currentPlan.name, newPlan.name) ? 'downgrade'
        : 'same_plan';

      if (planChangeType === 'upgrade') {
        const priceKey = `price_${data.feeTerm.replace("-", "_")}`;
        const newPlanPrice = newPlan[priceKey];
        if (!newPlanPrice) {
          throw new AppError(ERROR_CODES.VALIDATION_ERROR, `Price not configured for ${data.feeTerm}`, 400);
        }

        const lastPaymentResult = await client.query(
          `SELECT amount, subscription_start_date, subscription_end_date
           FROM subscription_payments
           WHERE school_id = $1
           ORDER BY payment_date DESC
           LIMIT 1`,
          [schoolId]
        );
        const lastPayment = lastPaymentResult.rows[0];

        let prorationResult = {
          originalAmount: newPlanPrice,
          creditApplied: 0,
          existingCreditUsed: 0,
          totalCreditApplied: 0,
          payableAmount: newPlanPrice,
          remainingDays: 0,
        };

        if (school.subscription_status === 'active' && lastPayment) {
          prorationResult = calculateUpgradePayable(
            newPlanPrice,
            parseFloat(lastPayment.amount),
            lastPayment.subscription_start_date,
            lastPayment.subscription_end_date,
            parseFloat(school.credit_balance || 0)
          );
        }

        const startDate = new Date();
        const endDate = calculateEndDate(startDate, data.feeTerm);

        await client.query(
          "UPDATE schools SET pending_downgrade_plan_id = NULL, pending_downgrade_date = NULL WHERE id = $1",
          [schoolId]
        );

        await client.query(
          `UPDATE schools SET 
            subscription_status = 'active',
            subscription_plan_id = $1,
            subscription_end_date = $2,
            fee_terms = $3,
            credit_balance = 0
          WHERE id = $4`,
          [data.planId, endDate.toISOString().split("T")[0], feeTermNumeric, schoolId]
        );

        await client.query(
          "UPDATE fee_terms_history SET end_date = CURRENT_DATE WHERE school_id = $1 AND end_date IS NULL",
          [schoolId],
        );
        await client.query(
          "INSERT INTO fee_terms_history (school_id, fee_terms, start_date) VALUES ($1, $2, CURRENT_DATE)",
          [schoolId, feeTermNumeric],
        );

        await client.query(
          `INSERT INTO subscription_payments 
            (school_id, plan_id, fee_term, amount, original_amount, credit_applied,
             payment_date, payment_mode, transaction_reference,
             subscription_start_date, subscription_end_date, payment_type)
          VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE, $8, $9, $10, 'upgrade')`,
          [
            schoolId, data.planId, data.feeTerm, prorationResult.payableAmount,
            prorationResult.originalAmount, prorationResult.totalCreditApplied,
            data.paymentMode || "cash",
            data.transactionReference || null,
            startDate.toISOString().split("T")[0],
            endDate.toISOString().split("T")[0],
          ]
        );

        await client.query(
          "UPDATE subscription_history SET end_date = CURRENT_DATE WHERE school_id = $1 AND end_date IS NULL",
          [schoolId]
        );
        await client.query(
          "INSERT INTO subscription_history (school_id, plan_id, start_date) VALUES ($1, $2, CURRENT_DATE)",
          [schoolId, data.planId]
        );

        await client.query("COMMIT");

        return {
          type: 'upgrade',
          schoolId,
          planId: data.planId,
          planName: newPlan.name,
          feeTerm: data.feeTerm,
          originalAmount: prorationResult.originalAmount,
          creditApplied: prorationResult.totalCreditApplied,
          payableAmount: prorationResult.payableAmount,
          remainingDays: prorationResult.remainingDays,
          startDate: startDate.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0],
        };
      }

      if (planChangeType === 'downgrade') {
        if (!school.subscription_end_date) {
          throw new AppError(ERROR_CODES.VALIDATION_ERROR, "No active subscription to downgrade from", 400);
        }

        const downgradeDate = new Date(school.subscription_end_date);

        await client.query(
          `UPDATE schools SET
            pending_downgrade_plan_id = $1,
            pending_downgrade_date = $2
          WHERE id = $3`,
          [data.planId, downgradeDate.toISOString().split("T")[0], schoolId]
        );

        await client.query(
          `INSERT INTO subscription_payments 
            (school_id, plan_id, fee_term, amount, original_amount, credit_applied,
             payment_date, payment_mode, transaction_reference,
             subscription_start_date, subscription_end_date, payment_type)
          VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE, $7, $8, $9, $10, 'downgrade_scheduled')`,
          [
            schoolId, data.planId, data.feeTerm, 0, 0, 0,
            data.paymentMode || "cash",
            data.transactionReference || null,
            downgradeDate.toISOString().split("T")[0],
            downgradeDate.toISOString().split("T")[0],
          ]
        );

        await client.query("COMMIT");

        return {
          type: 'downgrade',
          schoolId,
          currentPlanId: school.subscription_plan_id,
          currentPlanName: currentPlan.name,
          newPlanId: data.planId,
          newPlanName: newPlan.name,
          downgradeDate: downgradeDate.toISOString().split("T")[0],
          message: `Downgrade to ${newPlan.name} will take effect on ${downgradeDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}. Your current ${currentPlan.name} plan continues until then.`,
        };
      }

      const priceKey = `price_${data.feeTerm.replace("-", "_")}`;
      const amount = newPlan[priceKey];
      if (!amount) {
        throw new AppError(ERROR_CODES.VALIDATION_ERROR, `Price not configured for ${data.feeTerm}`, 400);
      }

      const startDate = new Date();
      const endDate = calculateEndDate(startDate, data.feeTerm);

      await client.query(
        `UPDATE schools SET 
          subscription_status = 'active',
          subscription_plan_id = $1,
          subscription_end_date = $2,
          fee_terms = $3
        WHERE id = $4`,
        [data.planId, endDate.toISOString().split("T")[0], feeTermNumeric, schoolId]
      );

      await client.query(
        "UPDATE fee_terms_history SET end_date = CURRENT_DATE WHERE school_id = $1 AND end_date IS NULL",
        [schoolId],
      );
      await client.query(
        "INSERT INTO fee_terms_history (school_id, fee_terms, start_date) VALUES ($1, $2, CURRENT_DATE)",
        [schoolId, feeTermNumeric],
      );

      await client.query(
        `INSERT INTO subscription_payments 
          (school_id, plan_id, fee_term, amount, original_amount, credit_applied,
           payment_date, payment_mode, transaction_reference,
           subscription_start_date, subscription_end_date, payment_type)
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE, $7, $8, $9, $10, 'billing_change')`,
        [
          schoolId, data.planId, data.feeTerm, amount, amount, 0,
          data.paymentMode || "cash",
          data.transactionReference || null,
          startDate.toISOString().split("T")[0],
          endDate.toISOString().split("T")[0],
        ]
      );

      await client.query(
        "UPDATE subscription_history SET end_date = CURRENT_DATE WHERE school_id = $1 AND end_date IS NULL",
        [schoolId]
      );
      await client.query(
        "INSERT INTO subscription_history (school_id, plan_id, start_date) VALUES ($1, $2, CURRENT_DATE)",
        [schoolId, data.planId]
      );

      await client.query("COMMIT");

      return {
        type: 'billing_change',
        schoolId,
        planId: data.planId,
        planName: newPlan.name,
        feeTerm: data.feeTerm,
        amount,
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async getSchoolSubscriptionHistory(schoolId) {
    const query = `
      SELECT sp.*, spl.name as plan_name
      FROM subscription_payments sp
      LEFT JOIN subscription_plans spl ON sp.plan_id = spl.id
      WHERE sp.school_id = $1
      ORDER BY sp.payment_date DESC
    `;
    const result = await pool.query(query, [schoolId]);
    return result.rows;
  }

  async calculateUpgrade(schoolId, data) {
    const schoolResult = await pool.query(
      "SELECT * FROM schools WHERE id = $1", [schoolId]
    );
    const school = schoolResult.rows[0];
    if (!school) {
      throw new AppError(ERROR_CODES.SCHOOL_NOT_FOUND, ERROR_MESSAGES[ERROR_CODES.SCHOOL_NOT_FOUND], 404);
    }

    const planResult = await pool.query(
      "SELECT * FROM subscription_plans WHERE id = $1", [data.planId]
    );
    const newPlan = planResult.rows[0];
    if (!newPlan) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Invalid subscription plan", 400);
    }

    const allowedFeeTerms = newPlan.allowed_fee_terms || ["yearly"];
    if (!allowedFeeTerms.includes(data.feeTerm)) {
      throw new AppError(
        ERROR_CODES.VALIDATION_ERROR,
        `Fee term '${data.feeTerm}' is not allowed for ${newPlan.name} plan. Allowed: ${allowedFeeTerms.join(", ")}`,
        400,
      );
    }

    const currentPlanResult = await pool.query(
      "SELECT * FROM subscription_plans WHERE id = $1", [school.subscription_plan_id]
    );
    const currentPlan = currentPlanResult.rows[0];

    const { isUpgrade, calculateUpgradePayable, calculateEndDate } = require("../../utils/proration");

    if (!isUpgrade(currentPlan.name, newPlan.name)) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Pricing calculation is only for upgrades", 400);
    }

    const priceKey = `price_${data.feeTerm.replace("-", "_")}`;
    const newPlanPrice = newPlan[priceKey];
    if (!newPlanPrice) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, `Price not configured for ${data.feeTerm}`, 400);
    }

    const lastPaymentResult = await pool.query(
      `SELECT amount, subscription_start_date, subscription_end_date
       FROM subscription_payments
       WHERE school_id = $1
       ORDER BY payment_date DESC
       LIMIT 1`,
      [schoolId]
    );
    const lastPayment = lastPaymentResult.rows[0];

    let prorationResult = {
      originalAmount: newPlanPrice,
      creditApplied: 0,
      existingCreditUsed: 0,
      totalCreditApplied: 0,
      payableAmount: newPlanPrice,
      remainingDays: 0,
    };

    if (school.subscription_status === 'active' && lastPayment) {
      prorationResult = calculateUpgradePayable(
        newPlanPrice,
        parseFloat(lastPayment.amount),
        lastPayment.subscription_start_date,
        lastPayment.subscription_end_date,
        parseFloat(school.credit_balance || 0)
      );
    }

    const endDate = calculateEndDate(new Date(), data.feeTerm);

    return {
      ...prorationResult,
      newPlanName: newPlan.name,
      currentPlanName: currentPlan.name,
      feeTerm: data.feeTerm,
      newEndDate: endDate.toISOString().split("T")[0],
    };
  }

  async applyPendingDowngrades() {
    try {
      const result = await pool.query(
        `UPDATE schools
         SET subscription_plan_id = pending_downgrade_plan_id,
             pending_downgrade_plan_id = NULL,
             pending_downgrade_date = NULL,
             fee_terms = 1
         WHERE pending_downgrade_date <= CURRENT_DATE
         AND pending_downgrade_plan_id IS NOT NULL
         RETURNING id, name, subscription_plan_id`
      );

      if (result.rows.length > 0) {
        console.log(`[${new Date().toISOString()}] Applied ${result.rows.length} pending downgrade(s):`,
          result.rows.map(r => r.name).join(", "));

        for (const school of result.rows) {
          await pool.query(
            "UPDATE subscription_history SET end_date = CURRENT_DATE WHERE school_id = $1 AND end_date IS NULL",
            [school.id]
          );
          await pool.query(
            "INSERT INTO subscription_history (school_id, plan_id, start_date) VALUES ($1, $2, CURRENT_DATE)",
            [school.id, school.subscription_plan_id]
          );
          await pool.query(
            "UPDATE fee_terms_history SET end_date = CURRENT_DATE WHERE school_id = $1 AND end_date IS NULL",
            [school.id]
          );
          await pool.query(
            "INSERT INTO fee_terms_history (school_id, fee_terms, start_date) VALUES ($1, 1, CURRENT_DATE)",
            [school.id]
          );
        }
      }

      return result.rows;
    } catch (error) {
      console.error("[applyPendingDowngrades] Failed:", error.message);
      throw error;
    }
  }

  async getAvailablePlansWithPricing() {
    const query = `
      SELECT 
        id,
        name,
        features,
        allowed_fee_terms,
        price_yearly,
        price_half_yearly,
        price_quarterly,
        price_monthly,
        created_at
      FROM subscription_plans
      ORDER BY id ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  async updatePlanPricing(planId, pricingData) {
    const planResult = await pool.query(
      "SELECT id, name FROM subscription_plans WHERE id = $1", [planId]
    );
    const plan = planResult.rows[0];
    if (!plan) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Subscription plan not found", 404);
    }

    const fields = [];
    const values = [];
    let paramCount = 1;

    if (pricingData.priceYearly !== undefined) {
      const yearly = pricingData.priceYearly;
      fields.push(`price_yearly = $${paramCount++}`);
      values.push(yearly);
      fields.push(`price_half_yearly = $${paramCount++}`);
      values.push(Math.round(yearly / 2));
      fields.push(`price_quarterly = $${paramCount++}`);
      values.push(Math.round(yearly / 4));
      fields.push(`price_monthly = $${paramCount++}`);
      values.push(Math.round(yearly / 12));
    }

    if (fields.length === 0) {
      throw new AppError(ERROR_CODES.INVALID_INPUT, "No pricing fields to update", 400);
    }

    values.push(planId);
    const updateQuery = `
      UPDATE subscription_plans
      SET ${fields.join(", ")}
      WHERE id = $${paramCount}
      RETURNING id, name, price_yearly, price_half_yearly, price_quarterly, price_monthly
    `;

    const result = await pool.query(updateQuery, values);
    return result.rows[0];
  }
}

module.exports = new SchoolsService();
