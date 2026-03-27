const pool = require("../../database/connection");
const { ERROR_CODES } = require("../../constants");
const AppError = require("../../utils/AppError");

class FeeTransactionsService {
  async generateFeeTransactions(data, schoolId) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Load all fee components for this class+year group
      const componentsResult = await client.query(
        `SELECT fs.*, ay.start_date as ay_start_date
         FROM fee_structures fs
         JOIN academic_years ay ON fs.academic_year_id = ay.id
         WHERE fs.school_id = $1 AND fs.class_id = $2 AND fs.academic_year_id = $3
         ORDER BY fs.fee_type`,
        [schoolId, data.classId, data.academicYearId]
      );

      if (componentsResult.rows.length === 0) {
        throw new AppError(ERROR_CODES.NOT_FOUND, "No fee structures found for this class and academic year", 404);
      }

      const components = componentsResult.rows;
      const feeTerms = components[0].fee_terms;
      const ayStartDate = components[0].ay_start_date;

      // Total annual fee = sum of all components
      const totalAnnualFee = components.reduce((sum, c) => sum + parseFloat(c.amount), 0);
      // Per term = total / feeTerms
      const perTermAmount = Math.round((totalAnnualFee / feeTerms) * 100) / 100;

      // Breakdown per term: each component's share = annual / feeTerms
      const termBreakdown = {};
      for (const comp of components) {
        termBreakdown[comp.fee_type] = Math.round((parseFloat(comp.amount) / feeTerms) * 100) / 100;
      }

      // Get active students
      const studentsResult = await client.query(
        "SELECT id FROM students WHERE current_class_id = $1 AND school_id = $2 AND status = 'active'",
        [data.classId, schoolId]
      );
      const students = studentsResult.rows;

      if (students.length === 0) {
        throw new AppError(ERROR_CODES.INVALID_INPUT, "No active students found in this class", 400);
      }

      const generated = [];
      const skipped = [];

      for (const student of students) {
        const existing = await client.query(
          "SELECT id FROM fee_transactions WHERE student_id = $1 AND academic_year_id = $2 AND school_id = $3 LIMIT 1",
          [student.id, data.academicYearId, schoolId]
        );
        if (existing.rows.length > 0) {
          skipped.push(student.id);
          continue;
        }

        // One transaction per term — combined bill
        for (let term = 1; term <= feeTerms; term++) {
          const dueDate = this.calculateDueDate(ayStartDate, term, feeTerms);
          const termNumber = feeTerms === 1 ? null : term;

          const result = await client.query(
            `INSERT INTO fee_transactions
               (school_id, student_id, fee_structure_id, academic_year_id,
                term_number, original_amount, amount_due, due_date, status, fee_breakdown)
             VALUES ($1, $2, $3, $4, $5, $6, $6, $7, 'pending', $8) RETURNING *`,
            [
              schoolId, student.id, components[0].id, data.academicYearId,
              termNumber, perTermAmount, dueDate, JSON.stringify(termBreakdown)
            ]
          );
          generated.push(result.rows[0]);
        }
      }

      await client.query("COMMIT");
      return {
        feeTerms,
        totalAnnualFee,
        perTermAmount,
        termBreakdown,
        generated: generated.length,
        skippedStudents: skipped.length,
        transactions: generated
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  calculateDueDate(startDate, termNumber, totalTerms) {
    // Parse date parts directly to avoid UTC vs local timezone shift
    const [year, month] = startDate.toString().split("T")[0].split("-").map(Number);
    const monthsPerTerm = 12 / totalTerms;
    // Due date = last day of the term (start of next term - 1 day)
    const termEndMonth = month - 1 + termNumber * monthsPerTerm; // 0-indexed month after term ends
    // Day 0 of next month = last day of current month
    const dueDate = new Date(year, termEndMonth, 0);
    const y = dueDate.getFullYear();
    const m = String(dueDate.getMonth() + 1).padStart(2, "0");
    const d = String(dueDate.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  async getFeeTransactionsBySchool(schoolId, filters = {}) {
    let query = `
      SELECT ft.*,
             s.full_name as student_name, s.admission_number,
             c.name as class_name, c.section as class_section,
             ay.year_name as academic_year_name,
             u.full_name as parent_name, u.phone as parent_phone
      FROM fee_transactions ft
      LEFT JOIN students s ON ft.student_id = s.id
      LEFT JOIN classes c ON s.current_class_id = c.id
      LEFT JOIN academic_years ay ON ft.academic_year_id = ay.id
      LEFT JOIN users u ON s.parent_id = u.id
      WHERE ft.school_id = $1
    `;
    const params = [schoolId];
    let p = 2;

    if (filters.studentId) { query += " AND ft.student_id = $" + p++; params.push(filters.studentId); }
    if (filters.classId) { query += " AND s.current_class_id = $" + p++; params.push(filters.classId); }
    if (filters.academicYearId) { query += " AND ft.academic_year_id = $" + p++; params.push(filters.academicYearId); }
    if (filters.status) { query += " AND ft.status = $" + p++; params.push(filters.status); }

    query += " ORDER BY ft.due_date ASC, s.full_name";
    const result = await pool.query(query, params);
    return result.rows;
  }

  async getFeeDefaulters(schoolId, filters = {}) {
    let query = `
      SELECT ft.*,
             s.full_name as student_name, s.admission_number,
             c.name as class_name, c.section as class_section,
             u.full_name as parent_name, u.phone as parent_phone, u.email as parent_email,
             (ft.amount_due - ft.amount_paid) as pending_amount
      FROM fee_transactions ft
      LEFT JOIN students s ON ft.student_id = s.id
      LEFT JOIN classes c ON s.current_class_id = c.id
      LEFT JOIN users u ON s.parent_id = u.id
      WHERE ft.school_id = $1
        AND ft.status IN ('pending', 'partial')
        AND ft.due_date < CURRENT_DATE
    `;
    const params = [schoolId];
    let p = 2;

    if (filters.classId) { query += " AND s.current_class_id = $" + p++; params.push(filters.classId); }
    if (filters.academicYearId) { query += " AND ft.academic_year_id = $" + p++; params.push(filters.academicYearId); }

    query += " ORDER BY ft.due_date ASC, s.full_name";
    const result = await pool.query(query, params);
    return result.rows;
  }

  async getStudentFeeTransactions(studentId, schoolId) {
    const result = await pool.query(
      `SELECT ft.*, ay.year_name as academic_year_name,
              (ft.amount_due - ft.amount_paid) as pending_amount
       FROM fee_transactions ft
       LEFT JOIN academic_years ay ON ft.academic_year_id = ay.id
       WHERE ft.student_id = $1 AND ft.school_id = $2
       ORDER BY ft.due_date ASC`,
      [studentId, schoolId]
    );
    return result.rows;
  }

  async verifyStudentBelongsToParent(studentId, parentId, schoolId) {
    const result = await pool.query(
      "SELECT id FROM students WHERE id = $1 AND parent_id = $2 AND school_id = $3",
      [studentId, parentId, schoolId]
    );
    if (result.rows.length === 0) {
      throw new AppError(ERROR_CODES.AUTH_UNAUTHORIZED, "You can only access fee data for your own children", 403);
    }
  }

  async getFeeTransactionById(transactionId, schoolId) {
    const result = await pool.query(
      `SELECT ft.*,
              s.full_name as student_name, s.admission_number,
              c.name as class_name, c.section as class_section,
              ay.year_name as academic_year_name,
              u.full_name as parent_name, u.phone as parent_phone,
              wu.full_name as waiver_approved_by_name,
              cu.full_name as collected_by_name
       FROM fee_transactions ft
       LEFT JOIN students s ON ft.student_id = s.id
       LEFT JOIN classes c ON s.current_class_id = c.id
       LEFT JOIN academic_years ay ON ft.academic_year_id = ay.id
       LEFT JOIN users u ON s.parent_id = u.id
       LEFT JOIN users wu ON ft.waiver_approved_by = wu.id
       LEFT JOIN users cu ON ft.collected_by = cu.id
       WHERE ft.id = $1 AND ft.school_id = $2`,
      [transactionId, schoolId]
    );
    if (result.rows.length === 0) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Fee transaction not found", 404);
    }
    return result.rows[0];
  }

  async recordPayment(transactionId, paymentData, schoolId, userId) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const currentResult = await client.query(
        "SELECT * FROM fee_transactions WHERE id = $1 AND school_id = $2",
        [transactionId, schoolId]
      );
      if (currentResult.rows.length === 0) {
        throw new AppError(ERROR_CODES.NOT_FOUND, "Fee transaction not found", 404);
      }

      const transaction = currentResult.rows[0];
      if (transaction.status === "paid") {
        throw new AppError(ERROR_CODES.INVALID_INPUT, "This transaction is already fully paid", 400);
      }

      const newAmountPaid = parseFloat(transaction.amount_paid) + parseFloat(paymentData.amountPaid);
      const amountDue = parseFloat(transaction.amount_due);

      if (newAmountPaid > amountDue) {
        throw new AppError(
          ERROR_CODES.INVALID_INPUT,
          "Payment exceeds due amount. Maximum payable: " + (amountDue - parseFloat(transaction.amount_paid)),
          400
        );
      }

      const status = newAmountPaid >= amountDue ? "paid" : newAmountPaid > 0 ? "partial" : "pending";

      const result = await client.query(
        `UPDATE fee_transactions
         SET amount_paid = $1, status = $2, payment_date = $3, payment_mode = $4, receipt_number = $5, collected_by = $6
         WHERE id = $7 AND school_id = $8 RETURNING *`,
        [
          newAmountPaid, status,
          paymentData.paymentDate || new Date().toISOString().split("T")[0],
          paymentData.paymentMode, paymentData.receiptNumber || null,
          userId, transactionId, schoolId
        ]
      );

      await client.query("COMMIT");
      return result.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async applyWaiver(transactionId, waiverData, schoolId, userId) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const currentResult = await client.query(
        "SELECT * FROM fee_transactions WHERE id = $1 AND school_id = $2",
        [transactionId, schoolId]
      );
      if (currentResult.rows.length === 0) {
        throw new AppError(ERROR_CODES.NOT_FOUND, "Fee transaction not found", 404);
      }

      const transaction = currentResult.rows[0];
      const newAmountDue = parseFloat(transaction.original_amount) - parseFloat(waiverData.waiverAmount);

      if (newAmountDue < 0) {
        throw new AppError(ERROR_CODES.INVALID_INPUT, "Waiver amount cannot exceed original amount", 400);
      }

      const amountPaid = parseFloat(transaction.amount_paid);
      const status = amountPaid >= newAmountDue ? "paid" : amountPaid > 0 ? "partial" : "pending";

      const result = await client.query(
        `UPDATE fee_transactions
         SET amount_due = $1, waiver_amount = $2, waiver_reason = $3, waiver_approved_by = $4, status = $5
         WHERE id = $6 AND school_id = $7 RETURNING *`,
        [newAmountDue, waiverData.waiverAmount, waiverData.waiverReason, userId, status, transactionId, schoolId]
      );

      await client.query("COMMIT");
      return result.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async updateFeeTransaction(transactionId, updateData, schoolId) {
    const fields = [];
    const values = [];
    let p = 1;

    if (updateData.dueDate !== undefined) { fields.push("due_date = $" + p++); values.push(updateData.dueDate); }

    if (fields.length === 0) {
      throw new AppError(ERROR_CODES.INVALID_INPUT, "No fields to update", 400);
    }

    values.push(transactionId, schoolId);
    const result = await pool.query(
      "UPDATE fee_transactions SET " + fields.join(", ") + " WHERE id = $" + p++ + " AND school_id = $" + p + " RETURNING *",
      values
    );
    if (result.rows.length === 0) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Fee transaction not found", 404);
    }
    return result.rows[0];
  }
}

module.exports = new FeeTransactionsService();
