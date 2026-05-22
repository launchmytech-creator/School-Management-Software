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
  const ok = r.status >= 200 && r.status < 300;
  if (!ok) console.error(`  ❌ ${label}: ${r.status} - ${JSON.stringify(r.body).substring(0, 120)}`);
  else console.log(`  ✅ ${label}: OK`);
  return ok;
}

async function run() {
  console.log('\n=== CUTM SCHOOL SETUP ===\n');

  // 1. Login
  let r = await api('POST', '/auth/login', { email: 'kanugulasunilkumar0511@gmail.com', password: '12345678' });
  if (r.status !== 200) { console.error('Login failed:', r.body.message); return; }
  const T = r.body.data.token;
  const schoolId = r.body.data.user.schoolId;
  console.log('✅ Logged in as:', r.body.data.user.fullName, '| School:', schoolId);

  // 2. Academic Year
  console.log('\n--- Academic Year ---');
  r = await api('POST', '/academic-years', { yearName: '2025-2026', startDate: '2025-06-01', endDate: '2026-05-31', isCurrent: true }, T);
  ok(r, 'Create Academic Year 2025-2026');
  const AY = r.body.id || r.body.data?.id;
  if (!AY) { console.error('No AY id', JSON.stringify(r.body)); return; }
  console.log('  Academic Year ID:', AY);

  // 3. Subjects
  console.log('\n--- Subjects ---');
  const subjectsList = [
    { name: 'Mathematics', code: 'MATH' },
    { name: 'Science', code: 'SCI' },
    { name: 'English', code: 'ENG' },
    { name: 'Social Studies', code: 'SST' },
    { name: 'Hindi', code: 'HIN' },
  ];
  const subjects = {};
  for (const s of subjectsList) {
    r = await api('POST', '/subjects', s, T);
    ok(r, `Subject: ${s.name}`);
    subjects[s.code] = r.body.id || r.body.data?.id;
  }

  // 4. Classes
  console.log('\n--- Classes ---');
  const classesList = [
    { name: 'Class 8', section: 'A' },
    { name: 'Class 9', section: 'A' },
    { name: 'Class 10', section: 'A' },
  ];
  const classes = {};
  for (const c of classesList) {
    r = await api('POST', '/classes', { name: c.name, section: c.section, academicYearId: AY }, T);
    ok(r, `Class: ${c.name} ${c.section}`);
    classes[`${c.name}-${c.section}`] = r.body.id || r.body.data?.id;
  }

  // 5. Assign subjects to classes
  console.log('\n--- Class Subjects ---');
  for (const clsKey of Object.keys(classes)) {
    const clsId = classes[clsKey];
    for (const code of ['MATH', 'SCI', 'ENG', 'SST', 'HIN']) {
      r = await api('POST', '/class-subjects', { classId: clsId, subjectId: subjects[code] }, T);
      // silent - just count
    }
    console.log(`  ✅ Subjects linked for ${clsKey}`);
  }

  // 6. Parents
  console.log('\n--- Parents ---');
  const parentData = [
    { email: 'parent.ravi@cutm.edu', password: 'Parent@123', fullName: 'Ravi Kumar', phone: '9100000001' },
    { email: 'parent.sunita@cutm.edu', password: 'Parent@123', fullName: 'Sunita Sharma', phone: '9100000002' },
    { email: 'parent.mahesh@cutm.edu', password: 'Parent@123', fullName: 'Mahesh Rao', phone: '9100000003' },
    { email: 'parent.kavitha@cutm.edu', password: 'Parent@123', fullName: 'Kavitha Reddy', phone: '9100000004' },
    { email: 'parent.suresh@cutm.edu', password: 'Parent@123', fullName: 'Suresh Babu', phone: '9100000005' },
    { email: 'parent.meena@cutm.edu', password: 'Parent@123', fullName: 'Meena Devi', phone: '9100000006' },
  ];
  const parents = [];
  for (const p of parentData) {
    r = await api('POST', '/parents', p, T);
    ok(r, `Parent: ${p.fullName}`);
    parents.push({ ...p, id: r.body.data?.id || r.body.id });
  }

  // 7. Students
  console.log('\n--- Students ---');
  const cls8 = classes['Class 8-A'];
  const cls9 = classes['Class 9-A'];
  const cls10 = classes['Class 10-A'];

  const studentsData = [
    // Class 8
    { fullName: 'Arjun Kumar', admissionNumber: 'CUTM-8-001', dob: '2013-03-15', gender: 'male', classId: cls8, parentIdx: 0, roll: '01' },
    { fullName: 'Priya Sharma', admissionNumber: 'CUTM-8-002', dob: '2013-07-22', gender: 'female', classId: cls8, parentIdx: 1, roll: '02' },
    { fullName: 'Rohit Rao', admissionNumber: 'CUTM-8-003', dob: '2013-11-08', gender: 'male', classId: cls8, parentIdx: 2, roll: '03' },
    { fullName: 'Sneha Reddy', admissionNumber: 'CUTM-8-004', dob: '2013-05-30', gender: 'female', classId: cls8, parentIdx: 3, roll: '04' },
    // Class 9
    { fullName: 'Aditya Babu', admissionNumber: 'CUTM-9-001', dob: '2012-01-18', gender: 'male', classId: cls9, parentIdx: 4, roll: '01' },
    { fullName: 'Anjali Devi', admissionNumber: 'CUTM-9-002', dob: '2012-09-25', gender: 'female', classId: cls9, parentIdx: 5, roll: '02' },
    { fullName: 'Vikram Babu', admissionNumber: 'CUTM-9-003', dob: '2012-06-12', gender: 'male', classId: cls9, parentIdx: 0, roll: '03' },
    { fullName: 'Divya Rao', admissionNumber: 'CUTM-9-004', dob: '2012-04-03', gender: 'female', classId: cls9, parentIdx: 1, roll: '04' },
    // Class 10
    { fullName: 'Kiran Kumar', admissionNumber: 'CUTM-10-001', dob: '2011-08-20', gender: 'male', classId: cls10, parentIdx: 2, roll: '01' },
    { fullName: 'Pooja Sharma', admissionNumber: 'CUTM-10-002', dob: '2011-12-14', gender: 'female', classId: cls10, parentIdx: 3, roll: '02' },
    { fullName: 'Suresh Reddy', admissionNumber: 'CUTM-10-003', dob: '2011-02-28', gender: 'male', classId: cls10, parentIdx: 4, roll: '03' },
    { fullName: 'Lakshmi Devi', admissionNumber: 'CUTM-10-004', dob: '2011-10-05', gender: 'female', classId: cls10, parentIdx: 5, roll: '04' },
  ];

  const students = [];
  for (const s of studentsData) {
    r = await api('POST', '/students', {
      fullName: s.fullName,
      admissionNumber: s.admissionNumber,
      dateOfBirth: s.dob,
      admissionDate: '2025-06-01',
      gender: s.gender,
      currentClassId: s.classId,
      parentId: parents[s.parentIdx]?.id,
      academicYearId: AY,
      rollNumber: s.roll,
      status: 'active'
    }, T);
    ok(r, `Student: ${s.fullName}`);
    students.push({ ...s, id: r.body.data?.id || r.body.id });
  }

  // 8. Attendance (last 10 days for all students)
  console.log('\n--- Attendance (last 10 days) ---');
  const today = new Date('2026-05-16');
  let attCount = 0;
  const allClassIds = [cls8, cls9, cls10];
  const classDayStudents = {};
  students.forEach(s => {
    if (!classDayStudents[s.classId]) classDayStudents[s.classId] = [];
    classDayStudents[s.classId].push(s);
  });

  for (let d = 9; d >= 0; d--) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // skip weekends

    const dateStr = date.toISOString().split('T')[0];

    for (const [clsId, clsStudents] of Object.entries(classDayStudents)) {
      const records = clsStudents.map((s, i) => ({
        studentId: s.id,
        // Mostly present, some absent/late
        status: (d === 2 && i === 0) ? 'absent' : (d === 4 && i === 1) ? 'late' : (d === 6 && i === 2) ? 'absent' : 'present',
        remarks: ''
      }));

      r = await api('POST', '/student-attendance', {
        classId: parseInt(clsId),
        date: dateStr,
        records
      }, T);
      if (r.status < 300) attCount++;
    }
  }
  console.log(`  ✅ Attendance marked for ${attCount} class-days`);

  // 9. Exams
  console.log('\n--- Exams ---');
  const examsData = [
    { name: 'Unit Test 1', type: 'unit_test', classId: cls8, startDate: '2025-08-10', endDate: '2025-08-12' },
    { name: 'Mid Term Exam', type: 'mid_term', classId: cls8, startDate: '2025-10-05', endDate: '2025-10-10' },
    { name: 'Unit Test 1', type: 'unit_test', classId: cls9, startDate: '2025-08-10', endDate: '2025-08-12' },
    { name: 'Mid Term Exam', type: 'mid_term', classId: cls9, startDate: '2025-10-05', endDate: '2025-10-10' },
    { name: 'Unit Test 1', type: 'unit_test', classId: cls10, startDate: '2025-08-10', endDate: '2025-08-12' },
    { name: 'Mid Term Exam', type: 'mid_term', classId: cls10, startDate: '2025-10-05', endDate: '2025-10-10' },
  ];

  const exams = [];
  for (const e of examsData) {
    r = await api('POST', '/exams', {
      name: e.name, examType: e.type, classId: e.classId,
      academicYearId: AY, startDate: e.startDate, endDate: e.endDate
    }, T);
    ok(r, `Exam: ${e.name} (Class ${e.classId})`);
    const examId = r.body.data?.id || r.body.id;
    if (!examId) continue;

    // Add subjects to exam
    const subjectsForExam = [];
    const maxMarks = e.type === 'unit_test' ? 25 : 50;
    for (const [code, subId] of Object.entries(subjects)) {
      r = await api('POST', `/exams/${examId}/subjects`, {
        subjectId: subId, maxMarks,
        examDate: e.startDate
      }, T);
      if (r.status < 300) {
        subjectsForExam.push({ id: r.body.data?.id || r.body.id, subjectId: subId, maxMarks });
      }
    }
    exams.push({ ...e, id: examId, examSubjects: subjectsForExam });
  }

  // 10. Exam Results (marks)
  console.log('\n--- Exam Marks ---');
  const classStudentMap = {};
  students.forEach(s => {
    if (!classStudentMap[s.classId]) classStudentMap[s.classId] = [];
    classStudentMap[s.classId].push(s);
  });

  let marksCount = 0;
  for (const exam of exams) {
    const clsStudents = classStudentMap[exam.classId] || [];
    for (const examSubject of exam.examSubjects) {
      const results = clsStudents.map(s => {
        // Generate realistic marks
        const max = examSubject.maxMarks;
        const baseScore = Math.floor(max * 0.6 + Math.random() * max * 0.35);
        return {
          studentId: s.id,
          marksObtained: Math.min(baseScore, max),
          isAbsent: false,
          grade: baseScore >= max * 0.9 ? 'A+' : baseScore >= max * 0.75 ? 'A' : baseScore >= max * 0.6 ? 'B' : 'C',
          remarks: ''
        };
      });

      r = await api('POST', '/exam-results/bulk', {
        examSubjectId: examSubject.id,
        results
      }, T);
      if (r.status < 300) marksCount += results.length;
    }
  }
  console.log(`  ✅ Marks entered: ${marksCount} records`);

  // 11. Fee Structure
  console.log('\n--- Fee Structures ---');
  const feeComponents = [
    { feeType: 'Tuition Fee', amount: 36000 },
    { feeType: 'Exam Fee', amount: 3000 },
    { feeType: 'Library Fee', amount: 1200 },
  ];
  for (const clsId of allClassIds) {
    for (const fc of feeComponents) {
      r = await api('POST', '/fee-structures', {
        classId: clsId, academicYearId: AY, feeTerms: 4,
        feeType: fc.feeType, amount: fc.amount
      }, T);
    }
    console.log(`  ✅ Fee structure set for class ${clsId}`);
  }

  // 12. Generate fee transactions
  console.log('\n--- Generating Fee Transactions ---');
  for (const clsId of allClassIds) {
    r = await api('POST', '/fee-transactions/generate', { classId: clsId, academicYearId: AY }, T);
    ok(r, `Fee transactions for class ${clsId}`);
    if (r.body.data) {
      console.log(`  Generated: ${r.body.data.generated} | perTerm: ₹${r.body.data.perTermAmount}`);
    }
  }

  // 13. Record some payments
  console.log('\n--- Recording Sample Payments ---');
  r = await api('GET', '/fee-transactions?academicYearId=' + AY, null, T);
  const txs = r.body.data?.data || [];
  let paidCount = 0;
  // Pay term 1 for first 6 students, partial for 2 students
  const term1Txs = txs.filter(t => t.term_number === 1);
  for (let i = 0; i < Math.min(6, term1Txs.length); i++) {
    const tx = term1Txs[i];
    const amtPaid = i < 4 ? parseFloat(tx.amount_due) : parseFloat(tx.amount_due) * 0.5;
    r = await api('PATCH', `/fee-transactions/${tx.id}/payment`, {
      amountPaid: amtPaid,
      paymentMode: i % 2 === 0 ? 'cash' : 'upi',
      paymentDate: '2025-07-05',
      receiptNumber: `RCP-2025-${String(i+1).padStart(3,'0')}`
    }, T);
    if (r.status < 300) paidCount++;
  }
  console.log(`  ✅ ${paidCount} fee payments recorded`);

  // Summary
  console.log('\n=== SETUP COMPLETE ===');
  console.log('\n📊 SCHOOL: CUTM (School ID:', schoolId, ')');
  console.log('\n👨‍💼 ADMIN LOGIN:');
  console.log('   Email: kanugulasunilkumar0511@gmail.com');
  console.log('   Password: 12345678');
  console.log('\n👨‍👩‍👧 PARENT CREDENTIALS (6 parents):');
  parentData.forEach((p, i) => {
    console.log(`   ${i+1}. ${p.fullName}`);
    console.log(`      Email: ${p.email}`);
    console.log(`      Password: ${p.password}`);
    console.log(`      Phone: ${p.phone}`);
  });
  console.log('\n📚 DATA CREATED:');
  console.log('   Academic Year: 2025-2026');
  console.log('   Classes: Class 8A, Class 9A, Class 10A');
  console.log('   Subjects: Mathematics, Science, English, Social Studies, Hindi');
  console.log('   Students: 12 (4 per class)');
  console.log('   Attendance: Last 10 working days');
  console.log('   Exams: Unit Test 1 + Mid Term (per class)');
  console.log('   Fee: ₹40,200/year | 4 terms | ₹10,050/term');
  console.log('   Fee Transactions: Generated + Some payments recorded');
}

run().catch(e => console.error('FATAL:', e.message, e.stack));
