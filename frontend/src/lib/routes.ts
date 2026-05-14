export type UserRole =
  | "super_admin"
  | "school_admin"
  | "accountant"
  | "teacher"
  | "parent"
  | "student";

export type RoutePath =
  | "dashboard"
  | "profile"
  | "academic-years"
  | "classes"
  | "students"
  | "add-student"
  | "teachers"
  | "parents"
  | "accountants"
  | "add-accountant"
  | "fees"
  | "fee-defaulters"
  | "fee-structures"
  | "exams"
  | "exam-results"
  | "marks-entry"
  | "subjects"
  | "syllabus-tracking"
  | "holidays"
  | "announcements"
  | "school-settings"
  | "student-promotion"
  | "student-history"
  | "teacher-attendance"
  | "teacher-allocation"
  | "class-comparison"
  | "schools"
  | "create-school"
  | "school-detail"
  | "attendance"
  | "syllabus"
  | "exam-results"
  | "fee-status"
  | "my-classes"
  | "students-class"
  | "fees-class"
  | "fee-defaulters-class"
  | "exam-results-class";

export interface RouteDefinition {
  path: RoutePath;
  label: string;
  roles: UserRole[];
  requiresActiveYear?: boolean;
  feature?: string;
  parent?: RoutePath;
}

export const ROUTE_PREFIXES = {
  SUPER_ADMIN: "/super-admin",
  ADMIN: "/admin",
  ACCOUNTANT: "/accountant",
  TEACHER: "/teacher",
  PARENT: "/parent",
} as const;

const buildRoute = (
  prefix: (typeof ROUTE_PREFIXES)[keyof typeof ROUTE_PREFIXES],
  path: RoutePath
): string => `${prefix}/${path}`;

export const SUPER_ADMIN_ROUTES = {
  DASHBOARD: buildRoute(ROUTE_PREFIXES.SUPER_ADMIN, "dashboard"),
  SCHOOLS: buildRoute(ROUTE_PREFIXES.SUPER_ADMIN, "schools"),
  CREATE_SCHOOL: buildRoute(ROUTE_PREFIXES.SUPER_ADMIN, "create-school"),
  SCHOOL_DETAIL: buildRoute(ROUTE_PREFIXES.SUPER_ADMIN, "schools"),
  PROFILE: buildRoute(ROUTE_PREFIXES.SUPER_ADMIN, "profile"),
} as const;

export const ADMIN_ROUTES = {
  DASHBOARD: buildRoute(ROUTE_PREFIXES.ADMIN, "dashboard"),
  PROFILE: buildRoute(ROUTE_PREFIXES.ADMIN, "profile"),
  ACADEMIC_YEARS: buildRoute(ROUTE_PREFIXES.ADMIN, "academic-years"),
  CLASSES: buildRoute(ROUTE_PREFIXES.ADMIN, "classes"),
  STUDENTS: buildRoute(ROUTE_PREFIXES.ADMIN, "students"),
  ADD_STUDENT: buildRoute(ROUTE_PREFIXES.ADMIN, "add-student"),
  TEACHERS: buildRoute(ROUTE_PREFIXES.ADMIN, "teachers"),
  TEACHER_ALLOCATION: buildRoute(ROUTE_PREFIXES.ADMIN, "teacher-allocation"),
  PARENTS: buildRoute(ROUTE_PREFIXES.ADMIN, "parents"),
  ACCOUNTANTS: buildRoute(ROUTE_PREFIXES.ADMIN, "accountants"),
  ADD_ACCOUNTANT: buildRoute(ROUTE_PREFIXES.ADMIN, "add-accountant"),
  FEES: buildRoute(ROUTE_PREFIXES.ADMIN, "fees"),
  FEE_DEFAULTERS: buildRoute(ROUTE_PREFIXES.ADMIN, "fee-defaulters"),
  FEE_STRUCTURES: buildRoute(ROUTE_PREFIXES.ADMIN, "fee-structures"),
  EXAMS: buildRoute(ROUTE_PREFIXES.ADMIN, "exams"),
  EXAM_RESULTS: buildRoute(ROUTE_PREFIXES.ADMIN, "exam-results"),
  MARKS_ENTRY: buildRoute(ROUTE_PREFIXES.ADMIN, "marks-entry"),
  SUBJECTS: buildRoute(ROUTE_PREFIXES.ADMIN, "subjects"),
  SYLLABUS_TRACKING: buildRoute(ROUTE_PREFIXES.ADMIN, "syllabus-tracking"),
  HOLIDAYS: buildRoute(ROUTE_PREFIXES.ADMIN, "holidays"),
  ANNOUNCEMENTS: buildRoute(ROUTE_PREFIXES.ADMIN, "announcements"),
  SCHOOL_SETTINGS: buildRoute(ROUTE_PREFIXES.ADMIN, "school-settings"),
  STUDENT_PROMOTION: buildRoute(ROUTE_PREFIXES.ADMIN, "student-promotion"),
  STUDENT_HISTORY: buildRoute(ROUTE_PREFIXES.ADMIN, "student-history"),
  TEACHER_ATTENDANCE: buildRoute(ROUTE_PREFIXES.ADMIN, "teacher-attendance"),
  CLASS_COMPARISON: buildRoute(ROUTE_PREFIXES.ADMIN, "class-comparison"),
} as const;

export const ACCOUNTANT_ROUTES = {
  DASHBOARD: buildRoute(ROUTE_PREFIXES.ACCOUNTANT, "dashboard"),
  FEES: buildRoute(ROUTE_PREFIXES.ACCOUNTANT, "fees"),
  FEE_DEFAULTERS: buildRoute(ROUTE_PREFIXES.ACCOUNTANT, "fee-defaulters"),
  FEE_STRUCTURES: buildRoute(ROUTE_PREFIXES.ACCOUNTANT, "fee-structures"),
  STUDENTS: buildRoute(ROUTE_PREFIXES.ACCOUNTANT, "students"),
  ADD_STUDENT: buildRoute(ROUTE_PREFIXES.ACCOUNTANT, "add-student"),
  ATTENDANCE: buildRoute(ROUTE_PREFIXES.ACCOUNTANT, "attendance"),
  ANNOUNCEMENTS: buildRoute(ROUTE_PREFIXES.ACCOUNTANT, "announcements"),
  EXAMS: buildRoute(ROUTE_PREFIXES.ACCOUNTANT, "exams"),
  EXAM_RESULTS: buildRoute(ROUTE_PREFIXES.ACCOUNTANT, "exam-results"),
  MARKS_ENTRY: buildRoute(ROUTE_PREFIXES.ACCOUNTANT, "marks-entry"),
  SUBJECTS: buildRoute(ROUTE_PREFIXES.ACCOUNTANT, "subjects"),
  STUDENT_HISTORY: buildRoute(ROUTE_PREFIXES.ACCOUNTANT, "student-history"),
} as const;

export const TEACHER_ROUTES = {
  DASHBOARD: buildRoute(ROUTE_PREFIXES.TEACHER, "dashboard"),
  SYLLABUS: buildRoute(ROUTE_PREFIXES.TEACHER, "syllabus"),
  STUDENTS: buildRoute(ROUTE_PREFIXES.TEACHER, "students"),
  ATTENDANCE: buildRoute(ROUTE_PREFIXES.TEACHER, "attendance"),
  ANNOUNCEMENTS: buildRoute(ROUTE_PREFIXES.TEACHER, "announcements"),
  MY_CLASSES: buildRoute(ROUTE_PREFIXES.TEACHER, "my-classes"),
} as const;

export const PARENT_ROUTES = {
  DASHBOARD: buildRoute(ROUTE_PREFIXES.PARENT, "dashboard"),
  ATTENDANCE: buildRoute(ROUTE_PREFIXES.PARENT, "attendance"),
  SYLLABUS: buildRoute(ROUTE_PREFIXES.PARENT, "syllabus"),
  FEES: buildRoute(ROUTE_PREFIXES.PARENT, "fees"),
  EXAM_RESULTS: buildRoute(ROUTE_PREFIXES.PARENT, "exam-results"),
  ANNOUNCEMENTS: buildRoute(ROUTE_PREFIXES.PARENT, "announcements"),
} as const;

export const ALL_ROUTES = {
  ...SUPER_ADMIN_ROUTES,
  ...ADMIN_ROUTES,
  ...ACCOUNTANT_ROUTES,
  ...TEACHER_ROUTES,
  ...PARENT_ROUTES,
} as const;

export type RouteKey = keyof typeof ALL_ROUTES;

export const getRoutePath = (prefix: string, path: RoutePath): string => {
  return `${prefix}/${path}`;
};

export const isActiveRoute = (
  currentPath: string,
  routePath: string
): boolean => {
  return currentPath.startsWith(routePath);
};

export const matchRoutePrefix = (
  pathname: string
): (typeof ROUTE_PREFIXES)[keyof typeof ROUTE_PREFIXES] | null => {
  for (const prefix of Object.values(ROUTE_PREFIXES)) {
    if (pathname.startsWith(prefix)) {
      return prefix;
    }
  }
  return null;
};

export const getRouteMetadata = (
  path: RoutePath
): { label: string; icon?: string } | null => {
  const metadata: Record<RoutePath, { label: string; icon?: string }> = {
    dashboard: { label: "Dashboard", icon: "LayoutDashboard" },
    profile: { label: "Profile", icon: "User" },
    "academic-years": { label: "Academic Years", icon: "Calendar" },
    classes: { label: "Classes", icon: "School" },
    students: { label: "Students", icon: "Users" },
    "add-student": { label: "Add Student", icon: "UserPlus" },
    teachers: { label: "Teachers", icon: "ChalkboardTeacher" },
    parents: { label: "Parents", icon: "Users" },
    accountants: { label: "Accountants", icon: "Calculator" },
    "add-accountant": { label: "Add Accountant", icon: "UserPlus" },
    fees: { label: "Fee Collection", icon: "IndianRupee" },
    "fee-defaulters": { label: "Fee Defaulters", icon: "AlertTriangle" },
    "fee-structures": { label: "Fee Structures", icon: "FileText" },
    exams: { label: "Exams", icon: "ClipboardList" },
    "exam-results": { label: "Exam Results", icon: "BarChart" },
    "marks-entry": { label: "Marks Entry", icon: "Pencil" },
    subjects: { label: "Subjects", icon: "BookOpen" },
    "syllabus-tracking": { label: "Syllabus Tracking", icon: "CheckSquare" },
    holidays: { label: "Holidays", icon: "CalendarX" },
    announcements: { label: "Announcements", icon: "Megaphone" },
    "school-settings": { label: "School Settings", icon: "Settings" },
    "student-promotion": { label: "Student Promotion", icon: "TrendingUp" },
    "student-history": { label: "Student History", icon: "History" },
    "teacher-attendance": { label: "Teacher Attendance", icon: "CheckCircle" },
    "teacher-allocation": { label: "Teacher Allocation", icon: "UserCheck" },
    "class-comparison": { label: "Class Comparison", icon: "GitCompare" },
    schools: { label: "Schools", icon: "Building" },
    "create-school": { label: "Create School", icon: "Plus" },
    "school-detail": { label: "School Details", icon: "Building" },
    attendance: { label: "Attendance", icon: "CalendarCheck" },
    syllabus: { label: "Syllabus", icon: "Book" },
    "fee-status": { label: "Fee Status", icon: "Receipt" },
    "my-classes": { label: "My Classes", icon: "GraduationCap" },
    "students-class": { label: "Class Students", icon: "Users" },
    "fees-class": { label: "Fee Collection", icon: "IndianRupee" },
    "fee-defaulters-class": { label: "Fee Defaulters", icon: "AlertTriangle" },
    "exam-results-class": { label: "Exam Results", icon: "BarChart" },
  };

  return metadata[path] || null;
};

export const PUBLIC_ROUTES = ["/login", "/register", "/forgot-password"] as const;

export const isPublicRoute = (pathname: string): boolean => {
  return PUBLIC_ROUTES.some((route) => pathname === route);
};