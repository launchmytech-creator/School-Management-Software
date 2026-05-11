// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Filters = Record<string, any>;

export const queryKeys = {
  // ── User (Auth) ────────────────────────────────
  user: {
    current: () => ['user', 'current'] as const,
  },

  // ── Reference Data (rarely changes) ─────────────
  classes: {
    all: (schoolId: number | null) => ['classes', { schoolId }] as const,
    byYear: (schoolId: number | null, yearId?: string) => ['classes', { schoolId, yearId }] as const,
  },

  academicYears: {
    all: (schoolId: number | null) => ['academic-years', { schoolId }] as const,
    current: (schoolId: number | null) => ['academic-years', 'current', { schoolId }] as const,
  },

  subjects: {
    all: (schoolId: number | null) => ['subjects', { schoolId }] as const,
    byClass: (schoolId: number | null, classId: string) => ['subjects', { schoolId, classId }] as const,
  },

  teachers: {
    all: (schoolId: number | null) => ['teachers', { schoolId }] as const,
    byId: (schoolId: number | null, id: string) => ['teachers', { schoolId, id }] as const,
    filtered: (schoolId: number | null, filters: Filters) => ['teachers', 'filtered', { schoolId, ...filters }] as const,
    allocations: (schoolId: number | null, teacherId: number, yearId: number) =>
      ['teachers', { schoolId, teacherId, yearId }, 'allocations'] as const,
  },

  // ── Dynamic Data (changes with user actions) ────
  students: {
    all: (schoolId: number | null) => ['students', { schoolId }] as const,
    byClass: (schoolId: number | null, classId: string) => ['students', { schoolId, classId }] as const,
    byId: (schoolId: number | null, id: number) => ['students', { schoolId, id }] as const,
    filtered: (schoolId: number | null, filters: Filters) => ['students', 'filtered', { schoolId, ...filters }] as const,
  },

  // ── Assignments ─────────────────────────────────
  assignments: {
    all: (schoolId: number | null) => ['assignments', { schoolId }] as const,
    byId: (schoolId: number | null, id: number) => ['assignments', { schoolId, id }] as const,
    byFilters: (schoolId: number | null, filters: Filters) => ['assignments', 'filtered', { schoolId, ...filters }] as const,
  },

  // ── Schools (Super Admin) ────────────────────────
  schools: {
    all: ['schools'] as const,
    byId: (id: string) => ['schools', id] as const,
    filtered: (filters: Filters) => ['schools', 'filtered', filters] as const,
  },

  feeTransactions: {
    all: (schoolId: number | null) => ['fee-transactions', { schoolId }] as const,
    byFilters: (schoolId: number | null, filters: Filters) =>
      ['fee-transactions', { schoolId, ...filters }] as const,
    byStudent: (schoolId: number | null, studentId: number) =>
      ['fee-transactions', { schoolId, studentId }, 'student'] as const,
  },

  feeDefaulters: {
    all: (schoolId: number | null) => ['fee-defaulters', { schoolId }] as const,
    byFilters: (schoolId: number | null, filters: Filters) =>
      ['fee-defaulters', { schoolId, ...filters }] as const,
  },

  feeStructures: {
    all: (schoolId: number | null) => ['fee-structures', { schoolId }] as const,
    grouped: (schoolId: number | null, filters: Filters) =>
      ['fee-structures', 'grouped', { schoolId, ...filters }] as const,
  },

  attendance: {
    all: (schoolId: number | null) => ['attendance', { schoolId }] as const,
    byFilters: (schoolId: number | null, filters: Filters) =>
      ['attendance', { schoolId, ...filters }] as const,
  },

  // ── Real-time Data (always fresh) ───────────────
  dashboard: {
    admin: (schoolId: number | null) => ['dashboard', 'admin', { schoolId }] as const,
    accountant: (schoolId: number | null) => ['dashboard', 'accountant', { schoolId }] as const,
    teacher: (schoolId: number | null, teacherId: number) => ['dashboard', 'teacher', { schoolId, teacherId }] as const,
    parent: (schoolId: number | null, parentId: number) => ['dashboard', 'parent', { schoolId, parentId }] as const,
  },

  announcements: {
    all: (schoolId: number | null) => ['announcements', { schoolId }] as const,
    byFilters: (schoolId: number | null, filters: Filters) =>
      ['announcements', { schoolId, ...filters }] as const,
  },

  notifications: {
    all: (schoolId: number | null) => ['notifications', { schoolId }] as const,
    byFilters: (schoolId: number | null, filters: Filters) =>
      ['notifications', { schoolId, ...filters }] as const,
  },

  promotions: {
    all: (schoolId: number | null) => ['promotions', { schoolId }] as const,
    byFilters: (schoolId: number | null, filters: Filters) =>
      ['promotions', { schoolId, ...filters }] as const,
  },

  syllabus: {
    allProgress: (schoolId: number | null) => ['syllabus', 'all-progress', { schoolId }] as const,
    classProgress: (schoolId: number | null, classSubjectId: number) =>
      ['syllabus', 'class-subject', { schoolId, classSubjectId }] as const,
  },

  classSubjects: {
    all: (schoolId: number | null) => ['class-subjects', { schoolId }] as const,
    byClass: (schoolId: number | null, classId: string) => ['class-subjects', { schoolId, classId }] as const,
  },

  exams: {
    all: (schoolId: number | null) => ['exams', { schoolId }] as const,
    byFilters: (schoolId: number | null, filters: Filters) =>
      ['exams', { schoolId, ...filters }] as const,
    results: (schoolId: number | null, examId: number) => ['exams', { schoolId, examId }, 'results'] as const,
  },

  timetables: {
    all: (schoolId: number | null) => ['timetables', { schoolId }] as const,
    byClass: (schoolId: number | null, classId: string) => ['timetables', { schoolId, classId }] as const,
  },

  holidays: {
    all: (schoolId: number | null) => ['holidays', { schoolId }] as const,
  },

  // ── Admin specific ───────────────────────────────
  accountant: {
    all: (schoolId: number | null) => ['accountants', { schoolId }] as const,
    byId: (schoolId: number | null, id: number) => ['accountants', { schoolId, id }] as const,
  },

  parents: {
    all: (schoolId: number | null) => ['parents', { schoolId }] as const,
    byId: (schoolId: number | null, id: number) => ['parents', { schoolId, id }] as const,
    filtered: (schoolId: number | null, filters: Filters) => ['parents', 'filtered', { schoolId, ...filters }] as const,
  },

  teacherAttendance: {
    all: (schoolId: number | null) => ['teacher-attendance', { schoolId }] as const,
    byFilters: (schoolId: number | null, filters: Filters) =>
      ['teacher-attendance', { schoolId, ...filters }] as const,
    byDate: (schoolId: number | null, date: string) =>
      ['teacher-attendance', 'date', { schoolId, date }] as const,
  },

  // ── Exam Results ──────────────────────────────────────────
  examResults: {
    all: (schoolId: number | null) => ['exam-results', { schoolId }] as const,
    filtered: (schoolId: number | null, filters: Filters) =>
      ['exam-results', 'filtered', { schoolId, ...filters }] as const,
    byStudent: (schoolId: number | null, studentId: number, filters?: Filters) =>
      ['exam-results', 'student', { schoolId, studentId, ...filters }] as const,
    classComparison: (schoolId: number | null, classIds: number[], yearId?: number) =>
      ['exam-results', 'comparison', { schoolId, classIds, yearId }] as const,
    classSubjectComparison: (schoolId: number | null, classIds: number[], yearId?: number) =>
      ['exam-results', 'subject-comparison', { schoolId, classIds, yearId }] as const,
    classesForComparison: (schoolId: number | null, className: string, yearId?: number) =>
      ['exam-results', 'classes-for-comparison', { schoolId, className, yearId }] as const,
  },

  // ── Subscription Plans ─────────────────────────────────────
  subscriptionPlans: {
    all: (schoolId: number | null) => ['subscription-plans', { schoolId }] as const,
  },

  // ── Student History ────────────────────────────────────────
  studentHistory: {
    byStudent: (schoolId: number | null, studentId: number) =>
      ['student-history', { schoolId, studentId }] as const,
  },
} as const;

