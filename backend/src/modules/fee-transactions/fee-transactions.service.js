const pool = require("../../database/connection");
const { ERROR_CODES } = require("../../constants");
const AppError = require("../../utils/AppError");

class FeeTransactionsService {
  async generateFeeTransactions(data, schoolId, userId) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Get school fee terms
      const schoolQuery = await client.query(
        "SELECT fee_terms FROM schools WHERE id = $1",
        [schoolId],
      );
      const feeTerms = schoolQuery.rows[0].fee_terms;

      // Get fee structure
      const feeStructureQuery = await client.query(
        "SELECT * FROM fee_structures WHERE id = $1 AND school_id = $2",
        [data.feeStructureId, schoolId],
      );

      if (feeStructureQuery.rows.length === 0) {
        throw new AppError(
          ERROR_CODES.NOT_FOUND,
          "Fee structure not found",
          404,
        );
      }

      const feeStructure = feeStructureQuery.rows[0];

      // Get students
      const studentsQuery = await client.query(
        "SELECT id FROM students WHERE current_class_id = $1 AND school_id = $2 AND status = 'active'",
        [feeStructure.class_id, schoolId],
      );

      const students = studentsQuery.rows;
      const generatedTransactions = [];

      // Generate transactions for each student based on fee terms
      for (const student of students) {
        for (let term = 1; term <= feeTerms; term++) {
          // Calculate due date based on term
          const dueDate = this.calculateDueDate(
            data.academicYearStartDate,
            term,
            feeTerms,
          );

          const insertQuery = `
            INSERT INTO fee_transactions (
              school_id, student_id, fee_structure_id, academic_year_id,
              term_number, original_amount, amount_due, due_date, status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
          `;

          const result = await client.query(insertQuery, [
            schoolId,
            student.id,
            data.feeStructureId,
            feeStructure.academic_year_id,
            term,
            feeStructure.amount,
            feeStructure.amount,
            dueDate,
            "pending",
          ]);

          generatedTransactions.push(result.rows[0]);
        }
      }

      await client.query("COMMIT");
      return {
        count: generatedTransactions.length,
        transactions: generatedTransactions,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  calculateDueDate(startDate, termNumber, totalTerms) {
    const start = new Date(startDate);
    const monthsPerTerm = 12 / totalTerms;
    const dueMonth = start.getMonth() + (termNumber - 1) * monthsPerTerm;
    const dueDate = new Date(start.getFullYear(), dueMonth, start.getDate());
    return dueDate.toISOString().split("T")[0];
  }

  async getFeeTransactionsBySchool(schoolId, filters = {}) {
    let query = `
      SELECT ft.*, 
             s.full_name as student_name, s.admission_number,
             c.name as class_name, c.section as class_section,
             ay.year_name as academic_year_name,
             fs.fee_type,
             u.full_name as parent_name, u.phone as parent_phone
      FROM fee_transactions ft
      LEFT JOIN students s ON ft.student_id = s.id
      LEFT JOIN classes c ON s.current_class_id = c.id
      LEFT JOIN academic_years ay ON ft.academic_year_id = ay.id
      LEFT JOIN fee_structures fs ON ft.fee_structure_id = fs.id
      LEFT JOIN users u ON s.parent_id = u.id
      WHERE ft.school_id = $1
    `;

    const params = [schoolId];
    let paramCount = 2;

    if (filters.studentId) {
      query += ` AND ft.student_id = $${paramCount++}`;
      params.push(filters.studentId);
    }

    if (filters.classId) {
      query += ` AND s.current_class_id = $${paramCount++}`;
      params.push(filters.classId);
    }

    if (filters.academicYearId) {
      query += ` AND ft.academic_year_id = $${paramCount++}`;
      params.push(filters.academicYearId);
    }

    if (filters.status) {
      query += ` AND ft.status = $${paramCount++}`;
      params.push(filters.status);
    }

    query += ` ORDER BY ft.due_date DESC, s.full_name`;

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
    let paramCount = 2;

    if (filters.classId) {
      query += ` AND s.current_class_id = $${paramCount++}`;
      params.push(filters.classId);
    }

    query += ` ORDER BY ft.due_date ASC, s.full_name`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getStudentFeeTransactions(studentId, schoolId) {
    const query = `
      SELECT ft.*, 
             fs.fee_type,
             ay.year_name as academic_year_name,
             (ft.amount_due - ft.amount_paid) as pending_amount
      FROM fee_transactions ft
      LEFT JOIN fee_structures fs ON ft.fee_structure_id = fs.id
      LEFT JOIN academic_years ay ON ft.academic_year_id = ay.id
      WHERE ft.student_id = $1 AND ft.school_id = $2
      ORDER BY ft.due_date DESC
    `;

    const result = await pool.query(query, [studentId, schoolId]);
    return result.rows;
  }

  async getFeeTransactionById(transactionId, schoolId) {
    const query = `
      SELECT ft.*, 
             s.full_name as student_name, s.admission_number,
             c.name as class_name, c.section as class_section,
             ay.year_name as academic_year_name,
             fs.fee_type,
             u.full_name as parent_name, u.phone as parent_phone,
             waiver_user.full_name as waiver_approved_by_name,
             collector.full_name as collected_by_name
      FROM fee_transactions ft
      LEFT JOIN students s ON ft.student_id = s.id
      LEFT JOIN classes c ON s.current_class_id = c.id
      LEFT JOIN academic_years ay ON ft.academic_year_id = ay.id
      LEFT JOIN fee_structures fs ON ft.fee_structure_id = fs.id
      LEFT JOIN users u ON s.parent_id = u.id
      LEFT JOIN users waiver_user ON ft.waiver_approved_by = waiver_user.id
      LEFT JOIN users collector ON ft.collected_by = collector.id
      WHERE ft.id = $1 AND ft.school_id = $2
    `;

    const result = await pool.query(query, [transactionId, schoolId]);

    if (result.rows.length === 0) {
      throw new AppError(
        ERROR_CODES.NOT_FOUND,
        "Fee transaction not found",
        404,
      );
    }

    return result.rows[0];
  }

  async recordPayment(transactionId, paymentData, schoolId, userId) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Get current transaction
      const currentQuery = await client.query(
        "SELECT * FROM fee_transactions WHERE id = $1 AND school_id = $2",
        [transactionId, schoolId],
      );

      if (currentQuery.rows.length === 0) {
        throw new AppError(
          ERROR_CODES.NOT_FOUND,
          "Fee transaction not found",
          404,
        );
      }

      const transaction = currentQuery.rows[0];
      const newAmountPaid =
        parseFloat(transaction.amount_paid) +
        parseFloat(paymentData.amountPaid);
      const amountDue = parseFloat(transaction.amount_due);

      let status = "pending";
      if (newAmountPaid >= amountDue) {
        status = "paid";
      } else if (newAmountPaid > 0) {
        status = "partial";
      }

      const updateQuery = `
        UPDATE fee_transactions 
        SET amount_paid = $1,
            status = $2,
            payment_date = $3,
            payment_mode = $4,
            receipt_number = $5,
            collected_by = $6
        WHERE id = $7 AND school_id = $8
        RETURNING *
      `;

      const result = await client.query(updateQuery, [
        newAmountPaid,
        status,
        paymentData.paymentDate || new Date().toISOString().split("T")[0],
        paymentData.paymentMode,
        paymentData.receiptNumber || null,
        userId,
        transactionId,
        schoolId,
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

  async applyWaiver(transactionId, waiverData, schoolId, userId) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Get current transaction
      const currentQuery = await client.query(
        "SELECT * FROM fee_transactions WHERE id = $1 AND school_id = $2",
        [transactionId, schoolId],
      );

      if (currentQuery.rows.length === 0) {
        throw new AppError(
          ERROR_CODES.NOT_FOUND,
          "Fee transaction not found",
          404,
        );
      }

      const transaction = currentQuery.rows[0];
      const newAmountDue =
        parseFloat(transaction.original_amount) -
        parseFloat(waiverData.waiverAmount);

      if (newAmountDue < 0) {
        throw new AppError(
          ERROR_CODES.INVALID_INPUT,
          "Waiver amount cannot exceed original amount",
          400,
        );
      }

      const updateQuery = `
        UPDATE fee_transactions 
        SET amount_due = $1,
            waiver_amount = $2,
            waiver_reason = $3,
            waiver_approved_by = $4
        WHERE id = $5 AND school_id = $6
        RETURNING *
      `;

      const result = await client.query(updateQuery, [
        newAmountDue,
        waiverData.waiverAmount,
        waiverData.waiverReason,
        userId,
        transactionId,
        schoolId,
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

  async updateFeeTransaction(transactionId, updateData, schoolId) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updateData.dueDate !== undefined) {
      fields.push(`due_date = $${paramCount++}`);
      values.push(updateData.dueDate);
    }

    if (fields.length === 0) {
      throw new AppError(ERROR_CODES.INVALID_INPUT, "No fields to update", 400);
    }

    values.push(transactionId, schoolId);
    const query = `
      UPDATE fee_transactions 
      SET ${fields.join(", ")}
      WHERE id = $${paramCount++} AND school_id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new AppError(
        ERROR_CODES.NOT_FOUND,
        "Fee transaction not found",
        404,
      );
    }

    return result.rows[0];
  }
}

module.exports = new FeeTransactionsService();
