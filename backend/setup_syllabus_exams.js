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
  else console.log(`  ✅ ${label}`);
  return success;
}

// Chapter content per subject
const CHAPTERS = {
  MATH: [
    'Rational Numbers', 'Linear Equations in One Variable', 'Understanding Quadrilaterals',
    'Practical Geometry', 'Data Handling', 'Squares and Square Roots',
    'Cubes and Cube Roots', 'Comparing Quantities', 'Algebraic Expressions',
    'Visualising Solid Shapes'
  ],
  SCI: [
    'Crop Production and Management', 'Microorganisms: Friend and Foe',
    'Synthetic Fibres and Plastics', 'Materials: Metals and Non-Metals',
    'Coal and Petroleum', 'Combustion and Flame', 'Conservation of Plants and Animals',
    'Cell — Structure and Functions', 'Reproduction in Animals', 'Force and Pressure'
  ],
  ENG: [
    'The Best Christmas Present in the World', 'The Tsunami', 'Glimpses of the Past',
    'Bepin Choudhury\'s Lapse of Memory', 'The Summit Within', 'This is Jody\'s Fawn',
    'A Visit to Cambridge', 'A Short Monsoon Diary', 'The Great Stone Face'
  ],
  SST: [
    'How, When and Where', 'From Trade to Territory', 'Ruling the Countryside',
    'Tribals, Dikus and the Vision of a Golden Age', 'When People Rebel',
    'Colonialism and the City', 'Weavers, Iron Smelters and Factory Owners',
    'Civilising the Native, Educating the Nation', 'Women, Caste and Reform',
    'The Changing World of Visual Arts'
  ],
  HIN: [
    'ध्वनि (कविता)', 'लाख की चूड़ियाँ', 'बस की यात्रा', 'दीवानों की हस्ती',
    'चिट्ठियों की अनूठी दुनिया', 'भगवान के डाकिए', 'क्या निराश हुआ जाए',
    'यह सबसे कठिन समय नहीं', 'कबीर की साखियाँ', 'कामचोर'
  ]
};

async function run() {
  console.log('\n=== CUTM: Class Subjects + Chapters + Syllabus + More Exams ===\n');

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
  const cls8 = allClasses.find(c => c.name === 'Class 8' && c.section === 'A');
  const cls9 = allClasses.find(c => c.name === 'Class 9' && c.section === 'A');
  const cls10 = allClasses.find(c => c.name === 'Class 10' && c.section === 'A');
  const classMap = { 'Class 8': cls8, 'Class 9': cls9, 'Class 10': cls10 };
  console.log('Classes:', { cls8: cls8?.id, cls9: cls9?.id, cls10: cls10?.id });

  // Get subjects
  r = await api('GET', '/subjects', null, T);
  const allSubjects = r.body.data || [];
  const subjectMap = {}; // code → {id, name}
  allSubjects.forEach(s => { subjectMap[s.code] = s; });
  console.log('Subjects:', Object.keys(subjectMap));

  // Get students
  r = await api('GET', '/students?limit=100', null, T);
  const allStudents = r.body.data?.data || r.body.data || [];
  const classStudentMap = {};
  allStudents.forEach(s => {
    const cid = s.current_class_id;
    if (!classStudentMap[cid]) classStudentMap[cid] = [];
    classStudentMap[cid].push(s);
  });
  console.log('Students:', allStudents.length);

  // ============================
  // 1. ASSIGN SUBJECTS TO CLASSES
  // ============================
  console.log('\n--- Assigning Subjects to Classes ---');
  const classSubjectMap = {}; // `${classId}_${subjectCode}` → classSubjectId
  for (const cls of [cls8, cls9, cls10]) {
    if (!cls) continue;
    for (const [code, subject] of Object.entries(subjectMap)) {
      r = await api('POST', '/class-subjects', {
        classId: cls.id,
        subjectId: subject.id,
        academicYearId: AY
      }, T);
      const csId = r.body.data?.id || r.body.id;
      if (csId) {
        classSubjectMap[`${cls.id}_${code}`] = csId;
        process.stdout.write('.');
      } else if (r.status === 409) {
        // Already exists - fetch it
        const existing = await api('GET', `/class-subjects/class/${cls.id}`, null, T);
        const subjects = existing.body.data || [];
        const found = subjects.find(s => s.subject_id === subject.id);
        if (found) classSubjectMap[`${cls.id}_${code}`] = found.id;
        process.stdout.write('~');
      } else {
        process.stdout.write('x');
      }
    }
  }
  console.log('\n  ✅ Class subjects assigned:', Object.keys(classSubjectMap).length);

  // ============================
  // 2. CREATE CHAPTERS
  // ============================
  console.log('\n--- Creating Chapters ---');
  const chapterMap = {}; // `${subjectCode}_${seq}` → chapterId
  for (const [code, chapters] of Object.entries(CHAPTERS)) {
    const subject = subjectMap[code];
    if (!subject) continue;

    // Check if chapters already exist for this subject
    r = await api('GET', `/chapters/subject/${subject.id}`, null, T);
    const existingChapters = r.body.data || [];

    if (existingChapters.length > 0) {
      existingChapters.forEach(ch => {
        chapterMap[`${code}_${ch.sequence_number}`] = ch.id;
      });
      console.log(`  ~ ${subject.name}: ${existingChapters.length} chapters already exist`);
      continue;
    }

    let created = 0;
    for (let i = 0; i < chapters.length; i++) {
      r = await api('POST', '/chapters', {
        subjectId: subject.id,
        name: chapters[i],
        sequenceNumber: i + 1
      }, T);
      const chId = r.body.data?.id || r.body.id;
      if (chId) {
        chapterMap[`${code}_${i + 1}`] = chId;
        created++;
      }
    }
    console.log(`  ✅ ${subject.name}: ${created} chapters created`);
  }

  // ============================
  // 3. SYLLABUS COMPLETION
  // ============================
  console.log('\n--- Marking Syllabus Completion ---');
  // For each class-subject, mark chapters with varying completion status
  // Class 8: chapters 1-5 completed, 6-7 in_progress, 8-10 pending
  // Class 9: chapters 1-4 completed, 5-6 in_progress, 7-10 pending
  // Class 10: chapters 1-6 completed, 7-8 in_progress, 9-10 pending
  const completionConfig = {
    [cls8?.id]: { completed: 5, inProgress: 2 },
    [cls9?.id]: { completed: 4, inProgress: 2 },
    [cls10?.id]: { completed: 6, inProgress: 2 },
  };

  let completionCount = 0;
  for (const cls of [cls8, cls9, cls10]) {
    if (!cls) continue;
    const config = completionConfig[cls.id];

    for (const [code] of Object.entries(subjectMap)) {
      const csId = classSubjectMap[`${cls.id}_${code}`];
      if (!csId) continue;

      // Gather chapters for this subject
      const chapterEntries = [];
      for (let i = 1; i <= CHAPTERS[code]?.length; i++) {
        const chId = chapterMap[`${code}_${i}`];
        if (!chId) continue;

        let status;
        if (i <= config.completed) status = 'completed';
        else if (i <= config.completed + config.inProgress) status = 'in_progress';
        else status = 'pending';

        chapterEntries.push({ chapterId: chId, status });
      }

      if (!chapterEntries.length) continue;

      // Check if completion already marked
      r = await api('GET', `/syllabus-completion?classSubjectId=${csId}`, null, T);
      const existing = r.body.data || [];
      if (existing.length > 0) {
        completionCount += existing.length;
        continue;
      }

      r = await api('POST', '/syllabus-completion', {
        classSubjectId: csId,
        chapters: chapterEntries
      }, T);
      if (r.status < 300) {
        completionCount += chapterEntries.length;
        process.stdout.write('.');
      } else {
        console.error(`\n  ❌ Syllabus for cls${cls.id} ${code}: ${r.status} - ${JSON.stringify(r.body).substring(0,120)}`);
      }
    }
  }
  console.log(`\n  ✅ Syllabus completion records: ${completionCount}`);

  // ============================
  // 4. MORE EXAMS
  // ============================
  console.log('\n--- Creating Additional Exams ---');
  const additionalExams = [
    { name: 'Unit Test 2', examType: 'Unit Test', startDate: '2025-12-05', endDate: '2025-12-07', maxMarks: 25 },
    { name: 'Annual Exam', examType: 'Annual', startDate: '2026-03-10', endDate: '2026-03-20', maxMarks: 100 },
  ];

  let totalNewMarks = 0;

  for (const examDef of additionalExams) {
    for (const cls of [cls8, cls9, cls10]) {
      if (!cls) continue;

      r = await api('POST', '/exams', {
        name: examDef.name,
        examType: examDef.examType,
        classId: cls.id,
        academicYearId: AY,
        startDate: examDef.startDate,
        endDate: examDef.endDate
      }, T);
      const examId = r.body.data?.id || r.body.id;
      if (!examId) {
        console.error(`  ❌ ${examDef.name} (${cls.name}): ${r.status} - ${JSON.stringify(r.body).substring(0,100)}`);
        continue;
      }
      console.log(`  ✅ ${examDef.name} - ${cls.name} ${cls.section} (ID: ${examId})`);

      // Add all 5 subjects to this exam
      const examSubjects = [];
      for (const [code, subject] of Object.entries(subjectMap)) {
        r = await api('POST', `/exams/${examId}/subjects`, {
          subjectId: subject.id,
          maxMarks: examDef.maxMarks,
          examDate: examDef.startDate
        }, T);
        const esId = r.body.data?.id || r.body.id;
        if (esId) examSubjects.push({ id: esId, maxMarks: examDef.maxMarks });
      }

      // Enter marks for this class's students
      const clsStudents = classStudentMap[cls.id] || [];
      for (const es of examSubjects) {
        const max = es.maxMarks;
        const results = clsStudents.map(s => {
          const score = Math.floor(max * 0.50 + Math.random() * max * 0.45);
          const marks = Math.min(score, max);
          return {
            studentId: s.id,
            marksObtained: marks,
            isAbsent: false,
            grade: marks >= max * 0.9 ? 'A+' : marks >= max * 0.75 ? 'A' : marks >= max * 0.6 ? 'B' : marks >= max * 0.45 ? 'C' : 'D',
            remarks: ''
          };
        });

        r = await api('POST', '/exam-results', { examSubjectId: es.id, results }, T);
        if (r.status < 300) totalNewMarks += results.length;
      }
    }
  }
  console.log(`  ✅ Marks for new exams: ${totalNewMarks} records`);

  // ============================
  // SUMMARY
  // ============================
  console.log('\n========================================');
  console.log('         SETUP COMPLETE SUMMARY');
  console.log('========================================');

  // Count totals
  const r1 = await api('GET', '/exams?academicYearId=' + AY + '&limit=100', null, T);
  const totalExams = r1.body.data?.total || r1.body.data?.length || (r1.body.data?.data || []).length;

  console.log('\n📚 ACADEMIC DATA:');
  console.log(`  Classes      : 3 (Class 8A, 9A, 10A)`);
  console.log(`  Subjects     : ${allSubjects.length} (Math, Science, English, SST, Hindi)`);
  console.log(`  Students     : ${allStudents.length}`);
  console.log(`  Chapters     : ${Object.keys(chapterMap).length} total (10 per subject)`);
  console.log(`  Syllabus     : Completion tracked for all class-subject combinations`);
  console.log(`  Exams        : Unit Test 1, Half Yearly, Unit Test 2, Annual (per class)`);
  console.log(`  Attendance   : Last 8 working days marked`);
  console.log(`  Fee          : ₹40,200/yr | 4 terms | ₹10,050/term`);

  console.log('\n👨‍👩‍👧 PARENT CREDENTIALS (Password: Parent@123)');
  console.log('  parent.ravi@cutm.edu     — Arjun Kumar (8A), Vikram Babu (9A)');
  console.log('  parent.sunita@cutm.edu   — Priya Sharma (8A), Divya Rao (9A)');
  console.log('  parent.mahesh@cutm.edu   — Rohit Rao (8A), Kiran Kumar (10A)');
  console.log('  parent.kavitha@cutm.edu  — Sneha Reddy (8A), Pooja Sharma (10A)');
  console.log('  parent.suresh@cutm.edu   — Aditya Babu (9A), Suresh Reddy (10A)');
  console.log('  parent.meena@cutm.edu    — Anjali Devi (9A), Lakshmi Devi (10A)');

  console.log('\n👨‍💼 ADMIN: kanugulasunilkumar0511@gmail.com / 12345678');
  console.log('========================================\n');
}

run().catch(console.error);
