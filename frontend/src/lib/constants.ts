export const APP_NAME = 'School Management System';
export const APP_VERSION = '1.0.0';

export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    STUDENTS: '/admin/students',
    ADD_STUDENT: '/admin/add-student',
    TEACHERS: '/admin/teachers',
    PARENTS: '/admin/parents',
    ACCOUNTANTS: '/admin/accountants',
    CLASSES: '/admin/classes',
    ACADEMIC_YEARS: '/admin/academic-years',
  },
  SUPER_ADMIN: {
    DASHBOARD: '/super-admin/dashboard',
    SCHOOLS: '/super-admin/schools',
    CREATE_SCHOOL: '/super-admin/create-school',
  },
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
  LISTS: 2 * 60 * 1000,
  DASHBOARD: 30 * 1000,
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