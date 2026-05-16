require('dotenv').config();
const http = require('http');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'school_management',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  ssl: false,
});

function api(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost', port: 3000,
      path: '/api/v1' + path, method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    if (data) opts.headers['Content-Length'] = Buffer.byteLength(data);
    const req = http.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(d) }); } catch(e) { resolve({ status: res.statusCode, body: d }); } });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function run() {
  console.log('\n=== CUTM FIX 2: Attendance + Marks ===\n');

  // Login
  let r = await api('POST', '/auth/login', { email: 'kanugulasunilkumar0511@gmail.com', password: '12345678' });
  if (r.status !== 200) { console.error('Login failed:', r.body.message); return; }
  const T = r.body.data.token;
  const schoolId = r.body.data.user.schoolId;
  console.log('✅ Logged in | School ID:', schoolId);

  // Get academic year
  r = await api('GET', '/academic-years', null, T);
  const AY = r.body.data?.find(a => a.year_name === '2025-2026')?.id || r.body.data?.[0]?.id;
  console.log('Academic Year ID:', AY);

  // Get classes
  r = await api('GET', '/classes?academicYearId=' + AY, null, T);
  const allClasses = r.body.data || [];
  const cls8 = allClasses.find(c => c.name === 'Class 8' && c.section === 'A')?.id;
  const cls9 = allClasses.find(c => c.name === 'Class 9' && c.section === 'A')?.id;
  const cls10 = allClasses.find(c => c.name === 'Class 10' && c.section === 'A')?.id;
  console.log('Classes:', { cls8, cls9, cls10 });

  // Get students from DB
  const studentsRes = await pool.query(
    'SELECT id, full_name, current_class_id FROM students WHERE school_id = $1 ORDER BY id',
    [schoolId]
  );
  const allStudents = studentsRes.rows;
  console.log('Students in DB:', allStudents.length);

  // Get admin user id
  const adminRes = await pool.query(
    "SELECT id FROM users WHERE email = 'kanugulasunilkumar0511@gmail.com' LIMIT 1"
  );
  const adminId = adminRes.rows[0]?.id;
  console.log('Admin user ID:', adminId);

  // === ATTENDANCE via DB ===
  console.log('\n--- Attendance (last 10 working days, direct DB insert) ---');
  const today = new Date('2026-05-16');

  // Group students by class
  const classDayStudents = {};
  allStudents.forEach(s => {
    const cid = s.current_class_id;
    if (!classDayStudents[cid]) classDayStudents[cid] = [];
    classDayStudents[cid].push(s);
  });

  let attCount = 0;
  for (let d = 9; d >= 0; d--) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;
    const dateStr = date.toISOString().split('T')[0];

    for (const [clsId, clsStudents] of Object.entries(classDayStudents)) {
      // Check if already marked
      const existing = await pool.query(
        'SELECT COUNT(*) as cnt FROM student_attendance WHERE class_id = $1 AND attendance_date = $2 AND school_id = $3',
        [parseInt(clsId), dateStr, schoolId]
      );
      if (parseInt(existing.rows[0].cnt) > 0) continue;

      for (let i = 0; i < clsStudents.length; i++) {
        const s = clsStudents[i];
        const status = (d === 2 && i === 0) ? 'absent' : (d === 4 && i === 1) ? 'late' : (d === 6 && i === 2) ? 'absent' : 'present';
        await pool.query(
          `INSERT INTO student_attendance (student_id, class_id, school_id, attendance_date, status, marked_by, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [s.id, parseInt(clsId), schoolId, dateStr, status, adminId]
        );
        attCount++;
      }
    }
  }
  console.log(`  ✅ Attendance records inserted: ${attCount}`);

  // === EXAM MARKS via API (correct route) ===
  console.log('\n--- Exam Marks ---');

  // Get all exams for this school/AY
  r = await api('GET', `/exams?academicYearId=${AY}&limit=100`, null, T);
  const allExams = r.body.data?.data || r.body.data || [];
  console.log('Exams found:', allExams.length);

  const classStudentMap = {};
  allStudents.forEach(s => {
    const cid = s.current_class_id;
    if (!classStudentMap[cid]) classStudentMap[cid] = [];
    classStudentMap[cid].push(s);
  });

  let marksCount = 0;
  for (const exam of allExams) {
    const clsStudents = classStudentMap[exam.class_id] || [];
    if (!clsStudents.length) continue;

    // Get exam subjects
    r = await api('GET', `/exams/${exam.id}`, null, T);
    const examDetail = r.body.data || {};
    const examSubjects = examDetail.subjects || examDetail.exam_subjects || [];

    for (const es of examSubjects) {
      const esId = es.id;
      const maxMarks = parseFloat(es.max_marks || es.maxMarks || 25);

      // Check if marks already entered
      const existingMarks = await pool.query(
        'SELECT COUNT(*) as cnt FROM exam_results WHERE exam_subject_id = $1',
        [esId]
      );
      if (parseInt(existingMarks.rows[0].cnt) > 0) {
        marksCount += parseInt(existingMarks.rows[0].cnt);
        continue;
      }

      const results = clsStudents.map(s => {
        const marks = Math.floor(maxMarks * 0.55 + Math.random() * maxMarks * 0.4);
        const capped = Math.min(marks, maxMarks);
        return {
          studentId: s.id,
          marksObtained: capped,
          isAbsent: false,
          grade: capped >= maxMarks * 0.9 ? 'A+' : capped >= maxMarks * 0.75 ? 'A' : capped >= maxMarks * 0.6 ? 'B' : 'C',
          remarks: ''
        };
      });

      r = await api('POST', '/exam-results', { examSubjectId: esId, results }, T);
      if (r.status < 300) {
        marksCount += results.length;
      } else {
        console.error(`  ❌ Marks for esId=${esId}: ${r.status} - ${JSON.stringify(r.body).substring(0,120)}`);
      }
    }
  }
  console.log(`  ✅ Marks entered: ${marksCount} records`);

  await pool.end();

  console.log('\n=== ALL DONE ===');
  console.log('\n📱 PARENT LOGIN CREDENTIALS (password for all: Parent@123)');
  console.log('┌─────────────────────────────────────────────────────────────────────────┐');
  console.log('│  Email                      Children                                    │');
  console.log('├─────────────────────────────────────────────────────────────────────────┤');
  console.log('│  parent.ravi@cutm.edu       Arjun Kumar (Cl 8), Vikram Babu (Cl 9)     │');
  console.log('│  parent.sunita@cutm.edu     Priya Sharma (Cl 8), Divya Rao (Cl 9)      │');
  console.log('│  parent.mahesh@cutm.edu     Rohit Rao (Cl 8), Kiran Kumar (Cl 10)      │');
  console.log('│  parent.kavitha@cutm.edu    Sneha Reddy (Cl 8), Pooja Sharma (Cl 10)   │');
  console.log('│  parent.suresh@cutm.edu     Aditya Babu (Cl 9), Suresh Reddy (Cl 10)   │');
  console.log('│  parent.meena@cutm.edu      Anjali Devi (Cl 9), Lakshmi Devi (Cl 10)   │');
  console.log('└─────────────────────────────────────────────────────────────────────────┘');
}

run().catch(console.error);
