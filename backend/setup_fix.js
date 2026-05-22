require('dotenv').config();
const http = require('http');

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

function ok(r, label) {
  const success = r.status >= 200 && r.status < 300;
  if (!success) console.error(`  ❌ ${label}: ${r.status} - ${JSON.stringify(r.body).substring(0, 150)}`);
  else console.log(`  ✅ ${label}: OK`);
  return success;
}

async function run() {
  console.log('\n=== CUTM FIX: Exams + Attendance ===\n');

  // Login
  let r = await api('POST', '/auth/login', { email: 'kanugulasunilkumar0511@gmail.com', password: '12345678' });
  if (r.status !== 200) { console.error('Login failed:', r.body.message); return; }
  const T = r.body.data.token;
  console.log('✅ Logged in as:', r.body.data.user.fullName);

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

  // Get subjects
  r = await api('GET', '/subjects', null, T);
  const allSubjects = r.body.data || [];
  const subjects = {};
  allSubjects.forEach(s => { subjects[s.code] = s.id; });
  console.log('Subjects:', subjects);

  // Get students
  r = await api('GET', '/students?limit=100', null, T);
  const allStudents = r.body.data?.data || r.body.data || [];
  console.log('Students found:', allStudents.length);

  // === ATTENDANCE ===
  console.log('\n--- Attendance (last 10 working days) ---');
  const today = new Date('2026-05-16');
  const classDayStudents = { [cls8]: [], [cls9]: [], [cls10]: [] };
  allStudents.forEach(s => {
    const cid = s.current_class_id;
    if (classDayStudents[cid]) classDayStudents[cid].push(s);
  });

  let attCount = 0;
  for (let d = 9; d >= 0; d--) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;
    const dateStr = date.toISOString().split('T')[0];

    for (const [clsId, clsStudents] of Object.entries(classDayStudents)) {
      if (!clsStudents.length) continue;
      const records = clsStudents.map((s, i) => ({
        studentId: s.id,
        status: (d === 2 && i === 0) ? 'absent' : (d === 4 && i === 1) ? 'late' : (d === 6 && i === 2) ? 'absent' : 'present',
        remarks: ''
      }));

      r = await api('POST', '/student-attendance', {
        classId: parseInt(clsId),
        attendanceDate: dateStr,  // FIXED: was 'date'
        records
      }, T);
      if (r.status < 300) attCount++;
      else if (r.status !== 409) console.error(`    Att error ${dateStr} cls${clsId}: ${r.status} - ${JSON.stringify(r.body).substring(0,100)}`);
    }
  }
  console.log(`  ✅ Attendance marked: ${attCount} class-days`);

  // === EXAMS ===
  console.log('\n--- Exams ---');
  const examsData = [
    { name: 'Unit Test 1', examType: 'Unit Test', classId: cls8, startDate: '2025-08-10', endDate: '2025-08-12', maxMarks: 25 },
    { name: 'Half Yearly Exam', examType: 'Half Yearly', classId: cls8, startDate: '2025-10-05', endDate: '2025-10-10', maxMarks: 50 },
    { name: 'Unit Test 1', examType: 'Unit Test', classId: cls9, startDate: '2025-08-10', endDate: '2025-08-12', maxMarks: 25 },
    { name: 'Half Yearly Exam', examType: 'Half Yearly', classId: cls9, startDate: '2025-10-05', endDate: '2025-10-10', maxMarks: 50 },
    { name: 'Unit Test 1', examType: 'Unit Test', classId: cls10, startDate: '2025-08-10', endDate: '2025-08-12', maxMarks: 25 },
    { name: 'Half Yearly Exam', examType: 'Half Yearly', classId: cls10, startDate: '2025-10-05', endDate: '2025-10-10', maxMarks: 50 },
  ];

  const exams = [];
  for (const e of examsData) {
    r = await api('POST', '/exams', {
      name: e.name, examType: e.examType, classId: e.classId,
      academicYearId: AY, startDate: e.startDate, endDate: e.endDate
    }, T);
    ok(r, `Exam: ${e.name} (cls${e.classId})`);
    const examId = r.body.data?.id || r.body.id;
    if (!examId) continue;

    // Add subjects to exam
    const examSubjects = [];
    for (const [code, subId] of Object.entries(subjects)) {
      r = await api('POST', `/exams/${examId}/subjects`, {
        subjectId: subId, maxMarks: e.maxMarks, examDate: e.startDate
      }, T);
      if (r.status < 300) {
        const esId = r.body.data?.id || r.body.id;
        if (esId) examSubjects.push({ id: esId, subjectId: subId, maxMarks: e.maxMarks });
      }
    }
    exams.push({ ...e, id: examId, examSubjects });
  }

  // === MARKS ===
  console.log('\n--- Exam Marks ---');
  const classStudentMap = {};
  allStudents.forEach(s => {
    const cid = s.current_class_id;
    if (!classStudentMap[cid]) classStudentMap[cid] = [];
    classStudentMap[cid].push(s);
  });

  let marksCount = 0;
  for (const exam of exams) {
    const clsStudents = classStudentMap[exam.classId] || [];
    for (const examSubject of exam.examSubjects) {
      const max = examSubject.maxMarks;
      const results = clsStudents.map(s => {
        const baseScore = Math.floor(max * 0.55 + Math.random() * max * 0.4);
        const marks = Math.min(baseScore, max);
        return {
          studentId: s.id,
          marksObtained: marks,
          isAbsent: false,
          grade: marks >= max * 0.9 ? 'A+' : marks >= max * 0.75 ? 'A' : marks >= max * 0.6 ? 'B' : 'C',
          remarks: ''
        };
      });

      r = await api('POST', '/exam-results/bulk', { examSubjectId: examSubject.id, results }, T);
      if (r.status < 300) marksCount += results.length;
      else console.error(`    Marks error: ${r.status} - ${JSON.stringify(r.body).substring(0,100)}`);
    }
  }
  console.log(`  ✅ Marks entered: ${marksCount} records`);

  console.log('\n=== FIX COMPLETE ===');
  console.log('\nAll demo data is now ready. Parent login credentials:');
  console.log('  parent.ravi@cutm.edu    → Parent@123  (children: Arjun Kumar, Vikram Babu)');
  console.log('  parent.sunita@cutm.edu  → Parent@123  (children: Priya Sharma, Divya Rao)');
  console.log('  parent.mahesh@cutm.edu  → Parent@123  (children: Rohit Rao, Kiran Kumar)');
  console.log('  parent.kavitha@cutm.edu → Parent@123  (children: Sneha Reddy, Pooja Sharma)');
  console.log('  parent.suresh@cutm.edu  → Parent@123  (children: Aditya Babu, Suresh Reddy)');
  console.log('  parent.meena@cutm.edu   → Parent@123  (children: Anjali Devi, Lakshmi Devi)');
}

run().catch(console.error);
