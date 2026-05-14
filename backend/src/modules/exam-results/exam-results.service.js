const pool = require("../../database/connection");
const { ERROR_CODES } = require("../../constants");
const AppError = require("../../utils/AppError");
const { buildPaginationQuery, formatPaginationResult } = require("../../utils/pagination");

class ExamResultsService {
  async enterMarks(marksData, schoolId, userId) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const results = [];

      for (const record of marksData.results) {
        // Check if result already exists - with schoolId for security
        const existingQuery = await client.query(
          "SELECT id FROM exam_results WHERE exam_subject_id = $1 AND student_id = $2 AND school_id = $3",
          [marksData.examSubjectId, record.studentId, schoolId],
        );

        if (existingQuery.rows.length > 0) {
          // Update existing result - with schoolId for security
          const updateQuery = `
            UPDATE exam_results 
            SET marks_obtained = $1, grade = $2, is_absent = $3, entered_by = $4, entered_at = CURRENT_TIMESTAMP
            WHERE exam_subject_id = $5 AND student_id = $6 AND school_id = $7
            RETURNING *
          `;
          const result = await client.query(updateQuery, [
            record.marksObtained || null,
            record.grade || null,
            record.isAbsent || false,
            userId,
            marksData.examSubjectId,
            record.studentId,
            schoolId,
          ]);
          results.push(result.rows[0]);
        } else {
          // Insert new result
          const insertQuery = `
            INSERT INTO exam_results (
              school_id, exam_subject_id, student_id, marks_obtained, 
              grade, is_absent, entered_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
          `;
          const result = await client.query(insertQuery, [
            schoolId,
            marksData.examSubjectId,
            record.studentId,
            record.marksObtained || null,
            record.grade || null,
            record.isAbsent || false,
            userId,
          ]);
          results.push(result.rows[0]);
        }
      }

      await client.query("COMMIT");
      return results;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async getResultsBySchool(schoolId, filters = {}, pagination = {}) {
    let query = `
      SELECT er.*, 
             s.full_name as student_name, s.admission_number, s.roll_number,
             es.max_marks, es.exam_date,
             sub.name as subject_name, sub.code as subject_code,
             e.name as exam_name, e.exam_type,
             c.name as class_name, c.section as class_section,
             u.full_name as entered_by_name
      FROM exam_results er
      LEFT JOIN students s ON er.student_id = s.id
      LEFT JOIN exam_subjects es ON er.exam_subject_id = es.id
      LEFT JOIN subjects sub ON es.subject_id = sub.id
      LEFT JOIN exams e ON es.exam_id = e.id
      LEFT JOIN classes c ON e.class_id = c.id
      LEFT JOIN users u ON er.entered_by = u.id
      WHERE er.school_id = $1
    `;

    const params = [schoolId];
    let paramCount = 2;

    if (filters.studentId) {
      query += ` AND er.student_id = $${paramCount++}`;
      params.push(filters.studentId);
    }

    if (filters.examId) {
      query += ` AND es.exam_id = $${paramCount++}`;
      params.push(filters.examId);
    }

    if (filters.classId) {
      query += ` AND e.class_id = $${paramCount++}`;
      params.push(filters.classId);
    }

    if (filters.subjectId) {
      query += ` AND es.subject_id = $${paramCount++}`;
      params.push(filters.subjectId);
    }

    if (filters.academicYearId) {
      query += ` AND e.academic_year_id = $${paramCount++}`;
      params.push(filters.academicYearId);
    }

    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      query += ` AND (LOWER(s.full_name) LIKE LOWER($${paramCount}) OR LOWER(s.admission_number) LIKE LOWER($${paramCount}))`;
      params.push(searchTerm);
      paramCount++;
    }

    query += ` ORDER BY e.start_date DESC, s.roll_number, s.full_name`;

    if (pagination.page || pagination.limit) {
      const { query: paginatedQuery, params: paginatedParams, countQuery, countParams, page, limit } =
        buildPaginationQuery(query, params, pagination);

      const [rowsResult, countResult] = await Promise.all([
        pool.query(paginatedQuery, paginatedParams),
        pool.query(countQuery, countParams),
      ]);

      return formatPaginationResult(rowsResult.rows, countResult.rows, page, limit);
    }

    const result = await pool.query(query, params);
    return { data: result.rows, pagination: null };
  }

  async getStudentResults(studentId, schoolId, filters = {}) {
    let query = `
      SELECT er.*, 
             es.max_marks, es.exam_date,
             sub.name as subject_name, sub.code as subject_code,
             e.name as exam_name, e.exam_type, e.start_date,
             ay.year_name as academic_year_name
      FROM exam_results er
      LEFT JOIN exam_subjects es ON er.exam_subject_id = es.id
      LEFT JOIN subjects sub ON es.subject_id = sub.id
      LEFT JOIN exams e ON es.exam_id = e.id
      LEFT JOIN academic_years ay ON e.academic_year_id = ay.id
      WHERE er.student_id = $1 AND er.school_id = $2
    `;

    const params = [studentId, schoolId];
    let paramCount = 3;

    if (filters.academicYearId) {
      query += ` AND e.academic_year_id = $${paramCount++}`;
      params.push(filters.academicYearId);
    }

    if (filters.examType) {
      query += ` AND e.exam_type = $${paramCount++}`;
      params.push(filters.examType);
    }

    query += ` ORDER BY e.start_date DESC, sub.name`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getExamSubjectResults(examSubjectId, schoolId) {
    const query = `
      SELECT er.*, 
             s.full_name as student_name, s.admission_number, s.roll_number,
             es.max_marks
      FROM exam_results er
      LEFT JOIN students s ON er.student_id = s.id
      LEFT JOIN exam_subjects es ON er.exam_subject_id = es.id
      WHERE er.exam_subject_id = $1 AND er.school_id = $2
      ORDER BY s.roll_number, s.full_name
    `;

    const result = await pool.query(query, [examSubjectId, schoolId]);
    return result.rows;
  }

  async getClassPerformance(examId, schoolId) {
    const query = `
      SELECT 
        sub.name as subject_name,
        sub.code as subject_code,
        es.max_marks,
        COUNT(er.id) as total_students,
        COUNT(er.id) FILTER (WHERE er.is_absent = false) as students_appeared,
        AVG(er.marks_obtained) FILTER (WHERE er.is_absent = false) as average_marks,
        MAX(er.marks_obtained) as highest_marks,
        MIN(er.marks_obtained) FILTER (WHERE er.is_absent = false) as lowest_marks
      FROM exam_subjects es
      LEFT JOIN subjects sub ON es.subject_id = sub.id
      LEFT JOIN exam_results er ON es.id = er.exam_subject_id
      WHERE es.exam_id = $1 AND es.school_id = $2
      GROUP BY sub.name, sub.code, es.max_marks
      ORDER BY sub.name
    `;

    const result = await pool.query(query, [examId, schoolId]);
    return result.rows;
  }

  async deleteResult(resultId, schoolId) {
    const query = `
      DELETE FROM exam_results 
      WHERE id = $1 AND school_id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [resultId, schoolId]);

    if (result.rows.length === 0) {
      throw new AppError(ERROR_CODES.NOT_FOUND, "Exam result not found", 404);
    }

    return result.rows[0];
  }

  async getClassComparison({ classIds, academicYearId, examType }, schoolId) {
    if (!classIds || classIds.length === 0) {
      throw new AppError(ERROR_CODES.INVALID_INPUT, "At least one class ID is required", 400);
    }

    const params = [schoolId];
    let paramCount = 2;

    let classFilter = `AND e.class_id = ANY($${paramCount++})`;
    params.push(classIds);

    if (academicYearId) {
      classFilter += ` AND e.academic_year_id = $${paramCount++}`;
      params.push(academicYearId);
    }

    if (examType) {
      classFilter += ` AND e.exam_type = $${paramCount++}`;
      params.push(examType);
    }

    const query = `
      WITH exam_data AS (
        SELECT 
          e.id as exam_id,
          e.name as exam_name,
          e.start_date as exam_date,
          e.exam_type,
          e.class_id,
          c.name as class_name,
          c.section as class_section,
          sub.id as subject_id,
          sub.name as subject_name,
          es.max_marks,
          er.marks_obtained,
          er.is_absent,
          er.student_id,
          CASE WHEN er.is_absent = false AND er.marks_obtained IS NOT NULL 
               AND er.marks_obtained >= (es.max_marks * 0.4) 
               THEN 1 ELSE 0 END as passed,
          CASE WHEN er.is_absent = false AND er.marks_obtained IS NOT NULL 
               THEN 1 ELSE 0 END as evaluated
        FROM exams e
        JOIN exam_subjects es ON e.id = es.exam_id
        JOIN subjects sub ON es.subject_id = sub.id
        JOIN classes c ON e.class_id = c.id
        LEFT JOIN exam_results er ON es.id = er.exam_subject_id
        WHERE e.school_id = $1 ${classFilter}
      )
      SELECT 
        exam_id,
        exam_name,
        exam_date,
        exam_type,
        class_id,
        class_name,
        class_section,
        subject_id,
        subject_name,
        max_marks,
        marks_obtained,
        is_absent,
        student_id,
        passed,
        evaluated
      FROM exam_data
      ORDER BY exam_date DESC, class_name, class_section, subject_name
    `;

    const result = await pool.query(query, params);
    const rows = result.rows;

    if (rows.length === 0) {
      return {
        summary: [],
        exams: [],
        subjects: [],
        trend: []
      };
    }

    const classMap = new Map();
    const uniqueClasses = [...new Set(rows.map(r => r.class_id))];
    
    for (const cid of uniqueClasses) {
      classMap.set(cid, {
        id: cid,
        name: rows.find(r => r.class_id === cid).class_name,
        section: rows.find(r => r.class_id === cid).class_section
      });
    }

    const summary = [];
    for (const [classId, classInfo] of classMap) {
      const classRows = rows.filter(r => r.class_id === classId);
      
      // Get unique students who were evaluated
      const evaluatedRows = classRows.filter(r => r.evaluated === 1);
      const uniqueStudentIds = [...new Set(evaluatedRows.map(r => r.student_id))];
      const totalStudents = uniqueStudentIds.length;
      
      // Calculate average marks per student, then average across students
      const studentAverages = [];
      for (const studentId of uniqueStudentIds) {
        const studentRows = evaluatedRows.filter(r => r.student_id === studentId);
        if (studentRows.length > 0) {
          const avg = studentRows.reduce((sum, r) => {
            const marks = parseFloat(r.marks_obtained) || 0;
            return sum + marks;
          }, 0) / studentRows.length;
          studentAverages.push(avg);
        }
      }
      const avgMarks = studentAverages.length > 0 
        ? studentAverages.reduce((a, b) => a + b, 0) / studentAverages.length 
        : 0;
      
      // Calculate pass rate (students who passed in at least one subject)
      const studentsPassed = uniqueStudentIds.filter(studentId => {
        const studentRows = classRows.filter(r => r.student_id === studentId && r.evaluated === 1);
        return studentRows.some(r => r.passed === 1);
      });
      const passRate = totalStudents > 0 ? (studentsPassed.length / totalStudents) * 100 : 0;

      summary.push({
        classId,
        className: classInfo.section ? `${classInfo.name} - ${classInfo.section}` : classInfo.name,
        totalStudents,
        averageMarks: parseFloat(avgMarks.toFixed(2)),
        passRate: parseFloat(passRate.toFixed(2))
      });
    }

    const examsMap = new Map();
    const uniqueExams = [...new Set(rows.map(r => r.exam_id))];
    
    for (const examId of uniqueExams) {
      const examRows = rows.filter(r => r.exam_id === examId);
      const firstRow = examRows[0];
      
      const examResults = [];
      for (const [classId, classInfo] of classMap) {
        const classExamRows = examRows.filter(r => r.class_id === classId);
        const evaluated = classExamRows.filter(r => r.evaluated === 1);
        
        const uniqueStudentIds = [...new Set(evaluated.map(r => r.student_id))];
        const studentAverages = [];
        for (const studentId of uniqueStudentIds) {
          const studentRows = evaluated.filter(r => r.student_id === studentId);
          if (studentRows.length > 0) {
            const avg = studentRows.reduce((sum, r) => {
              const marks = parseFloat(r.marks_obtained) || 0;
              return sum + marks;
            }, 0) / studentRows.length;
            studentAverages.push(avg);
          }
        }
        const avgMarks = studentAverages.length > 0 
          ? studentAverages.reduce((a, b) => a + b, 0) / studentAverages.length 
          : 0;
        
        // Count students who passed at least one subject
        const studentsPassed = uniqueStudentIds.filter(studentId => {
          const studentRows = classExamRows.filter(r => r.student_id === studentId && r.evaluated === 1);
          return studentRows.some(r => r.passed === 1);
        });
        
        examResults.push({
          classId,
          className: classInfo.section ? `${classInfo.name} - ${classInfo.section}` : classInfo.name,
          averageMarks: parseFloat(avgMarks.toFixed(2)),
          totalStudents: uniqueStudentIds.length,
          passed: studentsPassed.length
        });
      }
      
      examsMap.set(examId, {
        examId,
        examName: firstRow.exam_name,
        examDate: firstRow.exam_date,
        examType: firstRow.exam_type,
        results: examResults
      });
    }

    const exams = Array.from(examsMap.values()).sort((a, b) => 
      new Date(b.examDate).getTime() - new Date(a.examDate).getTime()
    );

      const subjectsMap = new Map();
    const uniqueSubjects = [...new Set(rows.map(r => r.subject_id))];
    
    for (const subjectId of uniqueSubjects) {
      const subjectRows = rows.filter(r => r.subject_id === subjectId);
      const firstRow = subjectRows[0];
      
      const subjectResults = [];
      for (const [classId, classInfo] of classMap) {
        const classSubjectRows = subjectRows.filter(r => r.class_id === classId);
        const evaluated = classSubjectRows.filter(r => r.evaluated === 1);
        
        // Calculate per-student average, then overall average
        const uniqueStudentIds = [...new Set(evaluated.map(r => r.student_id))];
        const studentAverages = [];
        for (const studentId of uniqueStudentIds) {
          const studentRows = evaluated.filter(r => r.student_id === studentId);
          if (studentRows.length > 0) {
            const avg = studentRows.reduce((sum, r) => sum + (r.marks_obtained || 0), 0) / studentRows.length;
            studentAverages.push(avg);
          }
        }
        const avgMarks = studentAverages.length > 0 
          ? studentAverages.reduce((a, b) => a + b, 0) / studentAverages.length 
          : 0;
        
        subjectResults.push({
          classId,
          className: classInfo.section ? `${classInfo.name} - ${classInfo.section}` : classInfo.name,
          averageMarks: parseFloat(avgMarks.toFixed(2)),
          totalStudents: uniqueStudentIds.length
        });
      }
      
      subjectsMap.set(subjectId, {
        subjectId,
        subjectName: firstRow.subject_name,
        results: subjectResults
      });
    }

    const subjects = Array.from(subjectsMap.values());

    const trend = exams.map(exam => {
      const trendPoint = {
        examId: exam.examId,
        examName: exam.examName,
        examDate: exam.examDate,
        examType: exam.examType
      };
      
      for (const result of exam.results) {
        trendPoint[`class_${result.classId}`] = result.averageMarks;
        trendPoint[`className_${result.classId}`] = result.className;
      }
      
      return trendPoint;
    });

    return {
      summary,
      exams,
      subjects,
      trend
    };
  }

  async getClassesForComparison(className, schoolId, academicYearId) {
    let query = `
      SELECT c.id, c.name, c.section
      FROM classes c
      WHERE c.school_id = $1
        AND LOWER(c.name) = LOWER($2)
    `;

    const params = [schoolId, className];

    if (academicYearId) {
      query += ` AND c.academic_year_id = $3`;
      params.push(academicYearId);
    }

    query += ` ORDER BY c.section NULLS LAST`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getClassSubjectComparison(classIds, schoolId, academicYearId) {
    if (!classIds || classIds.length === 0) {
      throw new AppError(ERROR_CODES.INVALID_INPUT, "At least one class ID is required", 400);
    }

    const params = [schoolId];
    let paramCount = 2;
    let classFilter = `AND c.id = ANY($${paramCount++})`;
    params.push(classIds);

    let academicFilter = "";
    if (academicYearId) {
      academicFilter = `AND e.academic_year_id = $${paramCount++}`;
      params.push(academicYearId);
    }

    const query = `
      SELECT 
        c.id as class_id,
        c.name as class_name,
        c.section as class_section,
        sub.id as subject_id,
        sub.name as subject_name,
        es.max_marks,
        er.marks_obtained,
        er.is_absent,
        s.id as student_id,
        CASE WHEN er.is_absent = false AND er.marks_obtained IS NOT NULL 
             AND er.marks_obtained >= (es.max_marks * 0.4) 
             THEN 1 ELSE 0 END as passed
      FROM exams e
      JOIN exam_subjects es ON e.id = es.exam_id
      JOIN subjects sub ON es.subject_id = sub.id
      JOIN classes c ON e.class_id = c.id
      LEFT JOIN exam_results er ON es.id = er.exam_subject_id
      LEFT JOIN students s ON er.student_id = s.id
      WHERE e.school_id = $1 ${classFilter} ${academicFilter}
      ORDER BY sub.name, c.name, c.section, s.roll_number
    `;

const result = await pool.query(query, params);
    const rows = result.rows;

    if (rows.length === 0) {
      return { subjects: [] };
    }

    // Group data by subject NAME (case-insensitive), then by class
    const subjectMap = new Map();
    const allClassesInfo = new Map(); // Track ALL classes info (name, section)

    // First pass: collect all classes first
    for (const row of rows) {
      const { class_id, class_name, class_section } = row;
      if (!allClassesInfo.has(class_id)) {
        allClassesInfo.set(class_id, {
          classId: class_id,
          className: class_section 
            ? `${class_name} - ${class_section}` 
            : class_name,
        });
      }
    }
    
    // Second pass: organize data by subject
    for (const row of rows) {
      const {
        class_id, class_name, class_section,
        subject_name,
        student_id, marks_obtained, passed, max_marks
      } = row;

      // Use subject NAME (lowercase) as key for grouping
      const subjectKey = subject_name.toLowerCase().trim();

      // Initialize subject if not exists
      if (!subjectMap.has(subjectKey)) {
        subjectMap.set(subjectKey, {
          subjectId: subjectKey,
          subjectName: subject_name,
          classes: new Map()
        });
      }

      const subject = subjectMap.get(subjectKey);

      // Initialize class within subject if not exists - create fresh data for this subject
      if (!subject.classes.has(class_id)) {
        subject.classes.set(class_id, {
          classId: class_id,
          className: allClassesInfo.get(class_id)?.className || (class_section ? `${class_name} - ${class_section}` : class_name),
          studentMarks: new Map(),  // Fresh Map for this subject
          totalStudents: 0,
          passedStudents: 0,
          marksSum: 0
        });
      }

      const classEntry = subject.classes.get(class_id);

      // Skip rows without exam result data (LEFT JOIN result means no result exists)
      if (student_id === null || marks_obtained === null) {
        continue;
      }
      
      // Only count if evaluated (has marks)
      if (!classEntry.studentMarks.has(student_id)) {
        classEntry.studentMarks.set(student_id, []);
        classEntry.totalStudents++;
      }
      
      classEntry.studentMarks.get(student_id).push({
        marks: parseFloat(marks_obtained) || 0,
        passed: passed === 1,
        maxMarks: max_marks
      });
    }

    // Second pass: calculate averages
    const subjects = [];
    for (const [subjectId, subject] of subjectMap) {
      const classResults = [];

      for (const [classId, classEntry] of subject.classes) {
        // Calculate per-student average marks, then class average
        const studentAverages = [];
        let studentsWhoPassedAll = true;

        for (const [studentId, marksList] of classEntry.studentMarks) {
          const avgMarks = marksList.reduce((sum, m) => sum + m.marks, 0) / marksList.length;
          studentAverages.push(avgMarks);

          const passedThisSubject = marksList.some(m => m.passed);
          if (!passedThisSubject) {
            studentsWhoPassedAll = false;
          }
        }

        // For pass rate: % of students who passed this subject
        const passedThisSubject = [...classEntry.studentMarks.values()].filter(
          marksList => marksList.some(m => m.passed)
        ).length;

        const passRate = classEntry.totalStudents > 0 
          ? (passedThisSubject / classEntry.totalStudents) * 100 
          : 0;

        // Average marks across all students
        const averageMarks = studentAverages.length > 0
          ? studentAverages.reduce((a, b) => a + b, 0) / studentAverages.length
          : 0;

        classResults.push({
          classId,
          className: classEntry.className,
          averageMarks: parseFloat(averageMarks.toFixed(2)),
          passRate: parseFloat(passRate.toFixed(2)),
          totalStudents: classEntry.totalStudents,
          passedStudents: passedThisSubject
        });
      }

      subjects.push({
        subjectId: subject.subjectId,
        subjectName: subject.subjectName,
        classes: classResults
      });
    }

    return { subjects };
  }

  async getClassSubjectsWithStats(classId, academicYearId, examType = null, schoolId) {
    const params = [];
    let paramCount = 1;
    let examTypeClause = '';
    let schoolIdClause = '';

    const classIdPlaceholder = `$${paramCount++}`;
    const academicYearPlaceholder = `$${paramCount++}`;
    params.push(classId);
    params.push(academicYearId);

    if (examType) {
      examTypeClause = ` AND e.exam_type = $${paramCount++}`;
      params.push(examType);
    }

    if (schoolId) {
      schoolIdClause = ` AND cs.school_id = $${paramCount++}`;
      params.push(schoolId);
    }

    const query = `
      SELECT
        sub.id as subject_id,
        sub.name as subject_name,
        sub.code as subject_code,
        COUNT(DISTINCT s.id) as total_students,
        COUNT(DISTINCT CASE WHEN er.is_absent = false AND er.marks_obtained IS NOT NULL THEN er.student_id END) as evaluated_count,
        COUNT(DISTINCT CASE WHEN er.is_absent = true THEN er.student_id END) as absent_count,
        COUNT(DISTINCT CASE WHEN er.is_absent = false AND er.marks_obtained >= es.max_marks * 0.4 THEN er.student_id END) as passed_count,
        COUNT(DISTINCT CASE WHEN er.is_absent = false AND er.marks_obtained < es.max_marks * 0.4 THEN er.student_id END) as failed_count,
        COALESCE(ROUND(AVG(CASE WHEN er.is_absent = false AND er.marks_obtained IS NOT NULL THEN er.marks_obtained::numeric END), 2), 0) as avg_marks
      FROM class_subjects cs
      JOIN subjects sub ON cs.subject_id = sub.id
      LEFT JOIN students s ON cs.class_id = s.current_class_id AND s.status = 'active'
      LEFT JOIN exam_subjects es ON sub.id = es.subject_id
      LEFT JOIN exams e ON es.exam_id = e.id AND e.academic_year_id = ${academicYearPlaceholder} AND e.class_id = cs.class_id
      LEFT JOIN exam_results er ON es.id = er.exam_subject_id
      WHERE cs.class_id = ${classIdPlaceholder} AND cs.academic_year_id = ${academicYearPlaceholder}${examTypeClause}${schoolIdClause}
      GROUP BY sub.id, sub.name, sub.code
      ORDER BY sub.name
    `;

    const result = await pool.query(query, params);
    return result.rows.map(row => ({
      subjectId: row.subject_id,
      subjectName: row.subject_name,
      subjectCode: row.subject_code,
      totalStudents: parseInt(row.total_students || 0),
      evaluatedCount: parseInt(row.evaluated_count || 0),
      absentCount: parseInt(row.absent_count || 0),
      passedCount: parseInt(row.passed_count || 0),
      failedCount: parseInt(row.failed_count || 0),
      avgMarks: parseFloat(row.avg_marks || 0),
    }));
  }

  async getClassResults(classId, filters = {}, schoolId = null) {
    const { academicYearId, subjectId, examType, search } = filters;

    const params = [];
    let paramCount = 1;

    const classIdPlaceholder = `$${paramCount++}`;
    params.push(classId);

    const academicYearPlaceholder = `$${paramCount++}`;
    params.push(academicYearId);

    let schoolIdClause = '';
    let schoolIdPlaceholder = '';
    if (schoolId) {
      schoolIdPlaceholder = `$${paramCount++}`;
      schoolIdClause = ` AND c.school_id = ${schoolIdPlaceholder}`;
      params.push(schoolId);
    }

    let subjectIdClause = '';
    let subjectIdPlaceholder = '';
    if (subjectId) {
      subjectIdPlaceholder = `$${paramCount++}`;
      subjectIdClause = ` AND sub.id = ${subjectIdPlaceholder}`;
      params.push(subjectId);
    }

    let examTypeClause = '';
    let examTypePlaceholder = '';
    if (examType) {
      examTypePlaceholder = `$${paramCount++}`;
      examTypeClause = ` AND e.exam_type = ${examTypePlaceholder}`;
      params.push(examType);
    }

    let searchClause = '';
    let searchPlaceholder = '';
    if (search) {
      searchPlaceholder = `$${paramCount++}`;
      searchClause = ` AND (s.full_name ILIKE ${searchPlaceholder} OR s.admission_number ILIKE ${searchPlaceholder})`;
      params.push(`%${search}%`);
    }

    const baseWhere = `WHERE c.id = ${classIdPlaceholder} AND e.academic_year_id = ${academicYearPlaceholder}${schoolIdClause}${subjectIdClause}${examTypeClause}`;

    const countQuery = `
      SELECT COUNT(DISTINCT e.id) as total
      FROM exams e
      JOIN exam_subjects es ON e.id = es.exam_id
      JOIN subjects sub ON es.subject_id = sub.id
      JOIN classes c ON e.class_id = c.id
      ${baseWhere}
    `;
    const countResult = await pool.query(countQuery, params);
    const totalExams = parseInt(countResult.rows[0].total || 0);

    const dataQuery = `
      SELECT 
        e.id as exam_id,
        e.name as exam_name,
        e.exam_type,
        e.start_date as exam_date,
        es.max_marks,
        COALESCE(
          json_agg(
            json_build_object(
              'resultId', er.id,
              'studentId', s.id,
              'studentName', s.full_name,
              'admissionNumber', s.admission_number,
              'rollNumber', s.roll_number,
              'marksObtained', er.marks_obtained,
              'grade', er.grade,
              'isAbsent', er.is_absent
            ) ORDER BY s.roll_number, s.full_name
          ) FILTER (WHERE er.id IS NOT NULL),
          '[]'
        ) as students
      FROM exams e
      JOIN exam_subjects es ON e.id = es.exam_id
      JOIN subjects sub ON es.subject_id = sub.id
      JOIN classes c ON e.class_id = c.id
      LEFT JOIN exam_results er ON es.id = er.exam_subject_id
      LEFT JOIN students s ON er.student_id = s.id ${searchClause ? `AND (s.full_name ILIKE ${searchPlaceholder} OR s.admission_number ILIKE ${searchPlaceholder})` : ''}
      ${baseWhere}${searchClause}
      GROUP BY e.id, e.name, e.exam_type, e.start_date, es.max_marks
      ORDER BY e.start_date DESC, e.name
    `;

    const dataResult = await pool.query(dataQuery, params);

    const groupedData = dataResult.rows.map(row => ({
      examId: row.exam_id,
      examName: row.exam_name,
      examType: row.exam_type,
      examDate: row.exam_date,
      maxMarks: row.max_marks,
      students: row.students || [],
    }));

    return {
      data: groupedData,
      totalExams,
    };
  }

  async getExamsForSubject(classId, subjectId, academicYearId, examType, schoolId) {
    const params = [];
    let paramCount = 1;

    const classIdPlaceholder = `$${paramCount++}`;
    params.push(classId);

    const academicYearPlaceholder = `$${paramCount++}`;
    params.push(academicYearId);

    const subjectIdPlaceholder = `$${paramCount++}`;
    params.push(subjectId);

    let schoolIdClause = '';
    if (schoolId) {
      schoolIdClause = ` AND c.school_id = $${paramCount++}`;
      params.push(schoolId);
    }

    let examTypeClause = '';
    if (examType) {
      examTypeClause = ` AND e.exam_type = $${paramCount++}`;
      params.push(examType);
    }

    const baseWhere = `WHERE c.id = ${classIdPlaceholder} AND e.academic_year_id = ${academicYearPlaceholder} AND sub.id = ${subjectIdPlaceholder}${schoolIdClause}${examTypeClause}`;

    const query = `
      SELECT 
        e.id as exam_id,
        e.name as exam_name,
        e.exam_type,
        e.start_date as exam_date,
        es.max_marks,
        COUNT(DISTINCT s.id) as total_students,
        COUNT(DISTINCT CASE WHEN er.id IS NOT NULL AND er.is_absent = false THEN er.id END) as evaluated,
        COUNT(DISTINCT CASE WHEN er.id IS NOT NULL AND er.is_absent = true THEN er.id END) as absent,
        COUNT(DISTINCT CASE WHEN er.id IS NOT NULL AND er.is_absent = false AND er.marks_obtained >= es.max_marks * 0.4 THEN er.id END) as passed,
        COUNT(DISTINCT CASE WHEN er.id IS NOT NULL AND er.is_absent = false AND er.marks_obtained < es.max_marks * 0.4 THEN er.id END) as failed
      FROM exams e
      JOIN exam_subjects es ON e.id = es.exam_id
      JOIN subjects sub ON es.subject_id = sub.id
      JOIN classes c ON e.class_id = c.id
      LEFT JOIN class_subjects cs ON cs.class_id = c.id AND cs.subject_id = sub.id AND cs.academic_year_id = e.academic_year_id
      LEFT JOIN students s ON s.current_class_id = c.id AND s.status = 'active'
      LEFT JOIN exam_results er ON er.exam_subject_id = es.id
      ${baseWhere}
      GROUP BY e.id, e.name, e.exam_type, e.start_date, es.max_marks
      ORDER BY e.start_date DESC, e.name
    `;

    const result = await pool.query(query, params);

    return {
      exams: result.rows.map(row => ({
        examId: row.exam_id,
        examName: row.exam_name,
        examType: row.exam_type,
        examDate: row.exam_date,
        maxMarks: row.max_marks,
        totalStudents: parseInt(row.total_students || 0),
        evaluated: parseInt(row.evaluated || 0),
        passed: parseInt(row.passed || 0),
        failed: parseInt(row.failed || 0),
        absent: parseInt(row.absent || 0),
      })),
    };
  }

  async getExamResults(classId, subjectId, examId, academicYearId, search, schoolId) {
    const params = [];
    let paramCount = 1;

    const classIdPlaceholder = `$${paramCount++}`;
    params.push(classId);

    const academicYearPlaceholder = `$${paramCount++}`;
    params.push(academicYearId);

    const subjectIdPlaceholder = `$${paramCount++}`;
    params.push(subjectId);

    const examIdPlaceholder = `$${paramCount++}`;
    params.push(examId);

    let schoolIdClause = '';
    let schoolIdPlaceholder = '';
    if (schoolId) {
      schoolIdPlaceholder = `$${paramCount++}`;
      schoolIdClause = ` AND c.school_id = ${schoolIdPlaceholder}`;
      params.push(schoolId);
    }

    let searchClause = '';
    let searchPlaceholder = '';
    if (search) {
      searchPlaceholder = `$${paramCount++}`;
      searchClause = ` AND (s.full_name ILIKE ${searchPlaceholder} OR s.admission_number ILIKE ${searchPlaceholder})`;
      params.push(`%${search}%`);
    }

    const baseWhere = `WHERE c.id = ${classIdPlaceholder} AND e.academic_year_id = ${academicYearPlaceholder} AND sub.id = ${subjectIdPlaceholder} AND e.id = ${examIdPlaceholder}${schoolIdClause}${searchClause}`;

    const examQuery = `
      SELECT 
        e.id as exam_id,
        e.name as exam_name,
        e.exam_type,
        e.start_date as exam_date,
        es.max_marks,
        sub.name as subject_name,
        sub.code as subject_code
      FROM exams e
      JOIN exam_subjects es ON e.id = es.exam_id
      JOIN subjects sub ON es.subject_id = sub.id
      JOIN classes c ON e.class_id = c.id
      WHERE e.id = ${examIdPlaceholder} AND sub.id = ${subjectIdPlaceholder} AND c.id = ${classIdPlaceholder} AND e.academic_year_id = ${academicYearPlaceholder}${schoolIdClause}
    `;
    const examResult = await pool.query(examQuery, params);
    
    if (examResult.rows.length === 0) {
      return {
        examId: null,
        examName: null,
        examType: null,
        examDate: null,
        maxMarks: 0,
        subjectName: null,
        subjectCode: null,
        totalStudents: 0,
        evaluated: 0,
        passed: 0,
        failed: 0,
        absent: 0,
        students: [],
      };
    }

    const exam = examResult.rows[0];

    const studentsQuery = `
      SELECT 
        er.id as result_id,
        s.id as student_id,
        s.full_name as student_name,
        s.admission_number,
        s.roll_number,
        er.marks_obtained,
        er.grade,
        er.is_absent
      FROM exam_results er
      JOIN students s ON er.student_id = s.id
      JOIN exam_subjects es ON er.exam_subject_id = es.id
      JOIN exams e ON es.exam_id = e.id
      JOIN subjects sub ON es.subject_id = sub.id
      JOIN classes c ON s.current_class_id = c.id
      ${baseWhere}
      ORDER BY s.roll_number, s.full_name
    `;
    const studentsResult = await pool.query(studentsQuery, params);

    const students = studentsResult.rows.map(row => ({
      resultId: row.result_id,
      studentId: row.student_id,
      studentName: row.student_name,
      admissionNumber: row.admission_number,
      rollNumber: row.roll_number,
      marksObtained: row.marks_obtained,
      grade: row.grade,
      isAbsent: row.is_absent,
    }));

    const totalStudents = students.length;
    const evaluated = students.filter(s => !s.isAbsent && s.marksObtained !== null).length;
    const passed = students.filter(s => !s.isAbsent && s.marksObtained !== null && s.marksObtained >= exam.max_marks * 0.4).length;
    const failed = students.filter(s => !s.isAbsent && s.marksObtained !== null && s.marksObtained < exam.max_marks * 0.4).length;
    const absent = students.filter(s => s.isAbsent).length;

    return {
      examId: exam.exam_id,
      examName: exam.exam_name,
      examType: exam.exam_type,
      examDate: exam.exam_date,
      maxMarks: exam.max_marks,
      subjectName: exam.subject_name,
      subjectCode: exam.subject_code,
      totalStudents,
      evaluated,
      passed,
      failed,
      absent,
      students,
    };
  }
}

module.exports = new ExamResultsService();
