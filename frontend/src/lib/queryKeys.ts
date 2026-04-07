// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Filters = Record<string, any>;

export const queryKeys = {
  // ── Reference Data (rarely changes) ─────────────
  classes: {
    all: ['classes'] as const,
    byYear: (yearId?: string) => ['classes', { yearId }] as const,
  },

  academicYears: {
    all: ['academic-years'] as const,
    current: ['academic-years', 'current'] as const,
  },

  subjects: {
    all: ['subjects'] as const,
    byClass: (classId: string) => ['subjects', { classId }] as const,
  },

  teachers: {
    all: ['teachers'] as const,
    byId: (id: string) => ['teachers', id] as const,
    filtered: (filters: Filters) => ['teachers', 'filtered', filters] as const,
    allocations: (teacherId: number, yearId: number) =>
      ['teachers', teacherId, 'allocations', yearId] as const,
  },

  // ── Dynamic Data (changes with user actions) ────
  students: {
    all: ['students'] as const,
    byClass: (classId: string) => ['students', { classId }] as const,
    byId: (id: number) => ['students', id] as const,
    filtered: (filters: Filters) => ['students', 'filtered', filters] as const,
  },

  // ── Assignments ─────────────────────────────────
  assignments: {
    all: ['assignments'] as const,
    byId: (id: number) => ['assignments', id] as const,
    byFilters: (filters: Filters) => ['assignments', 'filtered', filters] as const,
  },

  // ── Schools (Super Admin) ────────────────────────
  schools: {
    all: ['schools'] as const,
    byId: (id: string) => ['schools', id] as const,
    filtered: (filters: Filters) => ['schools', 'filtered', filters] as const,
  },

  feeTransactions: {
    all: ['fee-transactions'] as const,
    byFilters: (filters: Filters) =>
      ['fee-transactions', filters] as const,
    byStudent: (studentId: number) =>
      ['fee-transactions', 'student', studentId] as const,
  },

  feeDefaulters: {
    all: ['fee-defaulters'] as const,
    byFilters: (filters: Filters) =>
      ['fee-defaulters', filters] as const,
  },

  feeStructures: {
    all: ['fee-structures'] as const,
    grouped: (filters: Filters) =>
      ['fee-structures', 'grouped', filters] as const,
  },

  attendance: {
    byFilters: (filters: Filters) =>
      ['attendance', filters] as const,
  },

  // ── Real-time Data (always fresh) ───────────────
  dashboard: {
    admin: ['dashboard', 'admin'] as const,
    accountant: ['dashboard', 'accountant'] as const,
    teacher: (teacherId: number) => ['dashboard', 'teacher', teacherId] as const,
    parent: (parentId: number) => ['dashboard', 'parent', parentId] as const,
  },

  announcements: {
    all: ['announcements'] as const,
    byFilters: (filters: Filters) =>
      ['announcements', filters] as const,
  },

  notifications: {
    all: ['notifications'] as const,
    byFilters: (filters: Filters) =>
      ['notifications', filters] as const,
  },

  promotions: {
    byFilters: (filters: Filters) =>
      ['promotions', filters] as const,
  },

  syllabus: {
    allProgress: ['syllabus', 'all-progress'] as const,
    classProgress: (classSubjectId: number) =>
      ['syllabus', 'class-subject', classSubjectId] as const,
  },

  classSubjects: {
    all: ['class-subjects'] as const,
    byClass: (classId: string) => ['class-subjects', { classId }] as const,
  },

  exams: {
    all: ['exams'] as const,
    byFilters: (filters: Filters) =>
      ['exams', filters] as const,
    results: (examId: number) => ['exams', examId, 'results'] as const,
  },

  timetables: {
    byClass: (classId: string) => ['timetables', { classId }] as const,
  },

  holidays: {
    all: ['holidays'] as const,
  },
} as const;

