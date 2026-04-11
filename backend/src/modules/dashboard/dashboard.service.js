const pool = require("../../database/connection");

class DashboardService {
  // ═══════════════════════════════════════════════════════════════════
  //  ADMIN DASHBOARD — replaces 7+ frontend API calls
  // ═══════════════════════════════════════════════════════════════════
  async getAdminDashboard(schoolId) {
    // Run all stat queries in parallel
    const [
      countsResult,
      feeResult,
      attendanceResult,
      defaulterResult,
      syllabusResult,
      attendanceByClassResult,
    ] = await Promise.all([
      // 1. Entity counts (students, teachers, classes)
      pool.query(
        `SELECT
          (SELECT COUNT(*) FROM students WHERE school_id = $1 AND status = 'active') AS total_students,
          (SELECT COUNT(*) FROM users WHERE school_id = $1 AND role = 'teacher' AND is_active = true) AS total_teachers,
          (SELECT COUNT(*) FROM classes c
            JOIN academic_years ay ON c.academic_year_id = ay.id
            WHERE c.school_id = $1 AND ay.is_current = true) AS total_classes`,
        [schoolId],
      ),

      // 2. Fee overview
      pool.query(
        `SELECT
          COALESCE(SUM(amount_paid), 0) AS collected,
          COALESCE(SUM(amount_due - amount_paid), 0) AS pending,
          COALESCE(SUM(waiver_amount), 0) AS waived,
          COALESCE(SUM(amount_due), 0) AS total,
          COUNT(CASE WHEN status = 'paid' THEN 1 END) AS paid_count,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending_count,
          COUNT(CASE WHEN status = 'partial' THEN 1 END) AS partial_count
        FROM fee_transactions
        WHERE school_id = $1`,
        [schoolId],
      ),

      // 3. Today's attendance
      pool.query(
        `SELECT
          COUNT(CASE WHEN status = 'present' THEN 1 END) AS present,
          COUNT(CASE WHEN status = 'absent' THEN 1 END) AS absent,
          COUNT(CASE WHEN status = 'late' THEN 1 END) AS late,
          COUNT(*) AS total
        FROM student_attendance
        WHERE school_id = $1 AND attendance_date = CURRENT_DATE`,
        [schoolId],
      ),

      // 4. Defaulter count
      pool.query(
        `SELECT COUNT(DISTINCT student_id) AS defaulter_count
        FROM fee_transactions
        WHERE school_id = $1 AND status IN ('pending', 'partial')
          AND due_date < CURRENT_DATE`,
        [schoolId],
      ),

      // 5. Syllabus progress per class
      pool.query(
        `SELECT
          c.id AS class_id,
          c.name AS class_name,
          c.section AS class_section,
          COUNT(ch.id) AS total_chapters,
          COUNT(sc.id) FILTER (WHERE sc.status = 'completed') AS completed_chapters
        FROM classes c
        JOIN academic_years ay ON c.academic_year_id = ay.id
        LEFT JOIN class_subjects cs ON cs.class_id = c.id
        LEFT JOIN chapters ch ON ch.subject_id = cs.subject_id
        LEFT JOIN syllabus_completion sc ON sc.class_subject_id = cs.id AND sc.chapter_id = ch.id
        WHERE c.school_id = $1 AND ay.is_current = true
        GROUP BY c.id, c.name, c.section
        ORDER BY c.name`,
        [schoolId],
      ),

      // 6. Attendance by class (today)
      pool.query(
        `SELECT
          c.name AS class_name,
          c.section AS class_section,
          COUNT(CASE WHEN sa.status = 'present' THEN 1 END) AS present,
          COUNT(*) AS total
        FROM student_attendance sa
        JOIN classes c ON sa.class_id = c.id
        WHERE sa.school_id = $1 AND sa.attendance_date = CURRENT_DATE
        GROUP BY c.name, c.section
        ORDER BY c.name`,
        [schoolId],
      ),
    ]);

    const counts = countsResult.rows[0];
    const fee = feeResult.rows[0];
    const attendance = attendanceResult.rows[0];
    const defaulters = defaulterResult.rows[0];
    const totalStudents = parseInt(counts.total_students) || 0;
    const present = parseInt(attendance.present) || 0;
    const collected = parseFloat(fee.collected) || 0;
    const total = parseFloat(fee.total) || 0;

    return {
      stats: {
        totalStudents,
        totalTeachers: parseInt(counts.total_teachers) || 0,
        totalClasses: parseInt(counts.total_classes) || 0,
        feeCollected: collected,
        feePending: parseFloat(fee.pending) || 0,
        feeCollectionPercentage:
          total > 0 ? Math.round((collected / total) * 100) : 0,
        attendancePercentage:
          totalStudents > 0
            ? Math.round((present / totalStudents) * 100)
            : 0,
        pendingDefaulters: parseInt(defaulters.defaulter_count) || 0,
      },
      attendanceOverview: {
        present,
        absent: parseInt(attendance.absent) || 0,
        late: parseInt(attendance.late) || 0,
        total: totalStudents,
        byClass: attendanceByClassResult.rows.map((r) => ({
          className: r.class_name,
          classSection: r.class_section,
          present: parseInt(r.present) || 0,
          total: parseInt(r.total) || 0,
          percentage:
            parseInt(r.total) > 0
              ? Math.round(
                  (parseInt(r.present) / parseInt(r.total)) * 100,
                )
              : 0,
        })),
      },
      feeOverview: {
        collected,
        pending: parseFloat(fee.pending) || 0,
        waived: parseFloat(fee.waived) || 0,
        total,
        collectionPercentage:
          total > 0 ? Math.round((collected / total) * 100) : 0,
        byStatus: [
          {
            status: "paid",
            count: parseInt(fee.paid_count) || 0,
          },
          {
            status: "pending",
            count: parseInt(fee.pending_count) || 0,
          },
          {
            status: "partial",
            count: parseInt(fee.partial_count) || 0,
          },
        ],
      },
      syllabusProgress: syllabusResult.rows.map((r) => {
        const totalChapters = parseInt(r.total_chapters) || 0;
        const completed = parseInt(r.completed_chapters) || 0;
        return {
          classId: r.class_id,
          className: r.class_name,
          classSection: r.class_section,
          totalChapters,
          completedChapters: completed,
          overallPercentage:
            totalChapters > 0
              ? Math.round((completed / totalChapters) * 100)
              : 0,
        };
      }),
    };
  }

  // ═══════════════════════════════════════════════════════════════════
  //  ACCOUNTANT DASHBOARD — replaces 3 calls + heavy client filtering
  // ═══════════════════════════════════════════════════════════════════
  async getAccountantDashboard(schoolId) {
    const [
      todayResult,
      monthResult,
      pendingResult,
      defaulterResult,
      recentResult,
      monthlyChartResult,
    ] = await Promise.all([
      // 1. Today's collection
      pool.query(
        `SELECT
          COALESCE(SUM(amount_paid), 0) AS today_collection,
          COUNT(*) AS receipts_today
        FROM fee_transactions
        WHERE school_id = $1 AND payment_date = CURRENT_DATE AND status = 'paid'`,
        [schoolId],
      ),

      // 2. This month's collection
      pool.query(
        `SELECT COALESCE(SUM(amount_paid), 0) AS month_collection
        FROM fee_transactions
        WHERE school_id = $1
          AND payment_date >= date_trunc('month', CURRENT_DATE)
          AND status = 'paid'`,
        [schoolId],
      ),

      // 3. Total pending
      pool.query(
        `SELECT COALESCE(SUM(amount_due - amount_paid), 0) AS pending_amount
        FROM fee_transactions
        WHERE school_id = $1 AND status IN ('pending', 'partial')`,
        [schoolId],
      ),

      // 4. Defaulter count
      pool.query(
        `SELECT COUNT(DISTINCT student_id) AS defaulter_count
        FROM fee_transactions
        WHERE school_id = $1 AND status IN ('pending', 'partial')
          AND due_date < CURRENT_DATE`,
        [schoolId],
      ),

      // 5. Recent receipts (last 10)
      pool.query(
        `SELECT ft.id, s.full_name AS student_name,
          c.name AS class_name, c.section AS class_section,
          ft.amount_paid, ft.payment_date, ft.receipt_number, ft.payment_mode
        FROM fee_transactions ft
        JOIN students s ON ft.student_id = s.id
        JOIN classes c ON s.current_class_id = c.id
        WHERE ft.school_id = $1 AND ft.status = 'paid'
        ORDER BY ft.payment_date DESC, ft.id DESC
        LIMIT 10`,
        [schoolId],
      ),

      // 6. Monthly chart data (last 12 months)
      pool.query(
        `SELECT
          to_char(payment_date, 'Mon') AS month,
          EXTRACT(MONTH FROM payment_date) AS month_num,
          COALESCE(SUM(amount_paid), 0) AS amount
        FROM fee_transactions
        WHERE school_id = $1
          AND payment_date >= (CURRENT_DATE - INTERVAL '12 months')
          AND status = 'paid'
        GROUP BY to_char(payment_date, 'Mon'), EXTRACT(MONTH FROM payment_date)
        ORDER BY month_num`,
        [schoolId],
      ),
    ]);

    const todayCollection = parseFloat(todayResult.rows[0].today_collection) || 0;
    const monthCollection = parseFloat(monthResult.rows[0].month_collection) || 0;

    return {
      stats: {
        todayCollection,
        monthCollection,
        pendingAmount: parseFloat(pendingResult.rows[0].pending_amount) || 0,
        defaulterCount: parseInt(defaulterResult.rows[0].defaulter_count) || 0,
        receiptsToday: parseInt(todayResult.rows[0].receipts_today) || 0,
      },
      recentReceipts: recentResult.rows.map((r) => ({
        id: r.id,
        studentName: r.student_name,
        className: r.class_name,
        classSection: r.class_section,
        amountPaid: parseFloat(r.amount_paid) || 0,
        paymentDate: r.payment_date,
        receiptNumber: r.receipt_number,
        paymentMode: r.payment_mode,
      })),
      monthlyChart: monthlyChartResult.rows.map((r) => ({
        month: r.month,
        amount: parseFloat(r.amount) || 0,
      })),
    };
  }

  // ═══════════════════════════════════════════════════════════════════
  //  TEACHER DASHBOARD — replaces 1 + N calls (N+1 problem)
  // ═══════════════════════════════════════════════════════════════════
  async getTeacherDashboard(teacherId, schoolId) {
    const [allocationsResult, syllabusResult] = await Promise.all([
      // 1. All allocations for this teacher
      pool.query(
        `SELECT ta.id, ta.class_id, ta.subject_id,
          c.name AS class_name, c.section AS class_section,
          sub.name AS subject_name, sub.code AS subject_code,
          ay.year_name
        FROM teacher_allocations ta
        JOIN classes c ON ta.class_id = c.id
        JOIN subjects sub ON ta.subject_id = sub.id
        JOIN academic_years ay ON ta.academic_year_id = ay.id
        WHERE ta.teacher_id = $1 AND ta.school_id = $2 AND ay.is_current = true
        ORDER BY c.name, sub.name`,
        [teacherId, schoolId],
      ),

      // 2. Syllabus stats across all allocations (single query, not N)
      pool.query(
        `SELECT
          COUNT(ch.id) AS total_chapters,
          COUNT(sc.id) FILTER (WHERE sc.status = 'completed') AS completed_chapters
        FROM teacher_allocations ta
        JOIN class_subjects cs ON cs.class_id = ta.class_id AND cs.subject_id = ta.subject_id
        JOIN chapters ch ON ch.subject_id = ta.subject_id
        LEFT JOIN syllabus_completion sc ON sc.class_subject_id = cs.id AND sc.chapter_id = ch.id
        JOIN academic_years ay ON ta.academic_year_id = ay.id
        WHERE ta.teacher_id = $1 AND ta.school_id = $2 AND ay.is_current = true`,
        [teacherId, schoolId],
      ),
    ]);

    const total = parseInt(syllabusResult.rows[0]?.total_chapters) || 0;
    const completed = parseInt(syllabusResult.rows[0]?.completed_chapters) || 0;

    // Count unique classes
    const uniqueClasses = new Set(
      allocationsResult.rows.map((a) => a.class_id),
    );

    return {
      allocations: allocationsResult.rows.map((a) => ({
        id: a.id,
        classId: a.class_id,
        subjectId: a.subject_id,
        className: a.class_name,
        classSection: a.class_section,
        subjectName: a.subject_name,
        subjectCode: a.subject_code,
        yearName: a.year_name,
      })),
      syllabusStats: {
        overallPercentage:
          total > 0 ? Math.round((completed / total) * 100) : 0,
        completedChapters: completed,
        totalChapters: total,
      },
      uniqueClassCount: uniqueClasses.size,
      totalAllocations: allocationsResult.rows.length,
    };
  }
}

module.exports = new DashboardService();
