import { ADMIN_ROUTES, ACCOUNTANT_ROUTES, TEACHER_ROUTES, PARENT_ROUTES } from "./routes";

export const APP_NAME = 'School Management System';
export const APP_VERSION = '1.0.0';

export const ROUTES = {
  ...ADMIN_ROUTES,
  ...ACCOUNTANT_ROUTES,
  ...TEACHER_ROUTES,
  ...PARENT_ROUTES,
  LOGIN: '/login',
  REGISTER: '/register',
} as const;

export const ROUTE_PREFIXES = {
  SUPER_ADMIN: '/super-admin',
  ADMIN: '/admin',
  ACCOUNTANT: '/accountant',
  TEACHER: '/teacher',
  PARENT: '/parent',
} as const;

export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  SCHOOL_ADMIN: 'school_admin',
  ACCOUNTANT: 'accountant',
  TEACHER: 'teacher',
  PARENT: 'parent',
} as const;

export const STUDENT_STATUSES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  GRADUATED: 'graduated',
} as const;

export const FEE_STATUSES = {
  PAID: 'Paid',
  PENDING: 'Pending',
  PARTIAL: 'Partial',
} as const;

export const GENDERS = {
  MALE: 'Male',
  FEMALE: 'Female',
  OTHER: 'Other',
} as const;

export const SUBSCRIPTION_TIERS = {
  BASIC: 'BASIC',
  PREMIUM: 'PREMIUM',
  BUSINESS: 'BUSINESS',
} as const;

export const FEE_TERMS = {
  YEARLY: 'YEARLY',
  HALF_YEARLY: 'HALF-YEARLY',
  QUARTERLY: 'QUARTERLY',
  MONTHLY: 'MONTHLY',
} as const;

export const SUBSCRIPTION_STATUSES = {
  TRIAL: 'trial',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  EXPIRED: 'expired',
} as const;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
} as const;

export const DEBOUNCE_DELAY = {
  SEARCH: 300,
  AUTO_SAVE: 1000,
} as const;

export const API_TIMEOUT = 30000;

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER: 'user',
  THEME: 'theme',
  SIDEBAR_COLLAPSED: 'sidebar_collapsed',
} as const;

export const QUERY_STALE_TIME = {
  REFERENCE: 5 * 60 * 1000,
  LISTS: 5 * 60 * 1000, // Increased from 2min to 5min - reduces unnecessary refetches for list data
  DASHBOARD: 5 * 60 * 1000,
  OPERATIONAL: 1 * 60 * 1000,
} as const;

export const NOTIFICATION_MESSAGES = {
  SUCCESS: {
    CREATE: 'Created successfully',
    UPDATE: 'Updated successfully',
    DELETE: 'Deleted successfully',
    SAVE: 'Saved successfully',
  },
  ERROR: {
    GENERIC: 'Something went wrong. Please try again.',
    NETWORK: 'Network error. Please check your connection.',
    UNAUTHORIZED: 'Session expired. Please login again.',
    NOT_FOUND: 'Resource not found.',
    VALIDATION: 'Please check the form for errors.',
  },
} as const;

export const ERROR_MESSAGES = {
  FETCH: {
    CLASSES: 'Failed to fetch classes. Please try again.',
    STUDENTS: 'Failed to fetch students. Please try again.',
    TEACHERS: 'Failed to fetch teachers. Please try again.',
    PARENTS: 'Failed to fetch parents. Please try again.',
    ACCOUNTANTS: 'Failed to fetch accountants. Please try again.',
    SUBJECTS: 'Failed to fetch subjects. Please try again.',
    EXAMS: 'Failed to fetch exams. Please try again.',
    EXAM_RESULTS: 'Failed to fetch exam results. Please try again.',
    FEES: 'Failed to fetch fees. Please try again.',
    FEE_TRANSACTIONS: 'Failed to fetch fee transactions. Please try again.',
    FEE_STRUCTURES: 'Failed to fetch fee structures. Please try again.',
    ATTENDANCE: 'Failed to fetch attendance. Please try again.',
    TEACHER_ATTENDANCE: 'Failed to fetch teacher attendance. Please try again.',
    ACADEMIC_YEARS: 'Failed to fetch academic years. Please try again.',
    TIMETABLES: 'Failed to fetch timetables. Please try again.',
    SYLLABUS: 'Failed to fetch syllabus. Please try again.',
    HOLIDAYS: 'Failed to fetch holidays. Please try again.',
    ANNOUNCEMENTS: 'Failed to fetch announcements. Please try again.',
    ASSIGNMENTS: 'Failed to fetch assignments. Please try again.',
    REPORTS: 'Failed to fetch reports. Please try again.',
    SCHOOLS: 'Failed to fetch schools. Please try again.',
    SUBSCRIPTION_PLANS: 'Failed to fetch subscription plans. Please try again.',
    DASHBOARD: 'Failed to load dashboard. Please try again.',
    PARENT_CHILDREN: 'Failed to fetch children. Please try again.',
    STUDENT_HISTORY: 'Failed to fetch student history. Please try again.',
  },
  CREATE: {
    STUDENT: 'Failed to enroll student. Please check all fields.',
    TEACHER: 'Failed to add teacher. Please check all fields.',
    PARENT: 'Failed to create parent. Email might already exist.',
    ACCOUNTANT: 'Failed to add accountant. Please check all fields.',
    CLASS: 'Failed to create class. Please try again.',
    SUBJECT: 'Failed to create subject. Please try again.',
    EXAM: 'Failed to create exam. Please try again.',
    FEE_STRUCTURE: 'Failed to create fee structure. Please try again.',
    ATTENDANCE: 'Failed to mark attendance. Please try again.',
    TIMETABLE: 'Failed to create timetable. Please try again.',
    SYLLABUS: 'Failed to save syllabus. Please try again.',
    HOLIDAY: 'Failed to create holiday. Please try again.',
    ANNOUNCEMENT: 'Failed to create announcement. Please try again.',
    ASSIGNMENT: 'Failed to create assignment. Please try again.',
  },
  UPDATE: {
    STUDENT: 'Failed to update student. Please check all fields.',
    TEACHER: 'Failed to update teacher. Please check all fields.',
    ACCOUNTANT: 'Failed to update accountant. Please check all fields.',
    CLASS: 'Failed to update class. Please try again.',
    ATTENDANCE: 'Failed to update attendance. Please try again.',
    FEE_TRANSACTION: 'Failed to update fee transaction. Please try again.',
    TIMETABLE: 'Failed to update timetable. Please try again.',
    SYLLABUS: 'Failed to update syllabus. Please try again.',
  },
  DELETE: {
    STUDENT: 'Failed to remove student. Please try again.',
    TEACHER: 'Failed to remove teacher. Please try again.',
    CLASS: 'Failed to delete class. Please try again.',
    SUBJECT: 'Failed to delete subject. Please try again.',
    EXAM: 'Failed to delete exam. Please try again.',
    FEE_STRUCTURE: 'Failed to delete fee structure. Please try again.',
    TIMETABLE: 'Failed to delete timetable. Please try again.',
    HOLIDAY: 'Failed to delete holiday. Please try again.',
    ANNOUNCEMENT: 'Failed to delete announcement. Please try again.',
    ASSIGNMENT: 'Failed to delete assignment. Please try again.',
  },
  SAVE: {
    MARKS: 'Failed to save marks. Please try again.',
    ATTENDANCE: 'Failed to save attendance. Please try again.',
    FEE_PAYMENT: 'Failed to process payment. Please try again.',
  },
} as const;