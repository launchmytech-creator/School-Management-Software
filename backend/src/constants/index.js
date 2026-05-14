const ROLES = {
  SUPER_ADMIN: "super_admin",
  SCHOOL_ADMIN: "school_admin",
  TEACHER: "teacher",
  PARENT: "parent",
  ACCOUNTANT: "accountant",
};

const USER_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  SUSPENDED: "suspended",
};

const SUBSCRIPTION_STATUS = {
  ACTIVE: "active",
  SUSPENDED: "suspended",
  EXPIRED: "expired",
  TRIAL: "trial",
};

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

const ERROR_CODES = {
  // Authentication Errors
  AUTH_INVALID_CREDENTIALS: "AUTH_001",
  AUTH_TOKEN_MISSING: "AUTH_002",
  AUTH_TOKEN_INVALID: "AUTH_003",
  AUTH_TOKEN_EXPIRED: "AUTH_004",
  AUTH_UNAUTHORIZED: "AUTH_005",
  AUTH_RESET_TOKEN_INVALID: "AUTH_006",
  AUTH_RESET_TOKEN_EXPIRED: "AUTH_007",

  // User Errors
  USER_NOT_FOUND: "USER_001",
  USER_ALREADY_EXISTS: "USER_002",
  USER_INACTIVE: "USER_003",

  // Subject Errors [NEW]
  SUBJECT_ALREADY_EXISTS: "SUBJECT_001", // Thrown when creating subject with code that already exists
  SUBJECT_NOT_FOUND: "SUBJECT_002",

  // School Errors
  SCHOOL_NOT_FOUND: "SCHOOL_001",
  SCHOOL_INACTIVE: "SCHOOL_002",
  SCHOOL_SUBSCRIPTION_EXPIRED: "SCHOOL_003",
  SCHOOL_SUBSCRIPTION_SUSPENDED: "SCHOOL_004",
  SCHOOL_SUBSCRIPTION_TRIAL_EXPIRED: "SCHOOL_005",

  // Validation Errors
  VALIDATION_ERROR: "VAL_001",
  REQUIRED_FIELD_MISSING: "VAL_002",
  INVALID_INPUT: "VAL_003",
  DUPLICATE_RESOURCE: "VAL_004",

  // General Errors
  INTERNAL_ERROR: "SYS_001",
  DATABASE_ERROR: "SYS_002",
  RESOURCE_NOT_FOUND: "SYS_003",
  FORBIDDEN: "SYS_004",
  NOT_INCHARGE: "SYS_005", // [NEW] Thrown when teacher accesses resource requiring class incharge

  // [NEW] Attendance Validation Errors
  NOT_A_SCHOOL_DAY: "ATT_001", // Thrown when trying to mark attendance on a holiday
  SUNDAY_ATTENDANCE_NOT_ALLOWED: "ATT_002", // Thrown when trying to mark attendance on Sunday
};

const ERROR_MESSAGES = {
  [ERROR_CODES.AUTH_INVALID_CREDENTIALS]: "Invalid email or password",
  [ERROR_CODES.AUTH_TOKEN_MISSING]: "Authentication token is missing",
  [ERROR_CODES.AUTH_TOKEN_INVALID]: "Invalid authentication token",
  [ERROR_CODES.AUTH_TOKEN_EXPIRED]: "Authentication token has expired",
  [ERROR_CODES.AUTH_UNAUTHORIZED]:
    "You are not authorized to perform this action",
  [ERROR_CODES.AUTH_RESET_TOKEN_INVALID]: "Invalid reset token",
  [ERROR_CODES.AUTH_RESET_TOKEN_EXPIRED]: "Reset token has expired",

  [ERROR_CODES.USER_NOT_FOUND]: "User not found",
  [ERROR_CODES.USER_ALREADY_EXISTS]: "User with this email already exists",
  [ERROR_CODES.USER_INACTIVE]: "User account is inactive",

  [ERROR_CODES.SCHOOL_NOT_FOUND]: "School not found",
  [ERROR_CODES.SCHOOL_INACTIVE]: "School is inactive",
  [ERROR_CODES.SCHOOL_SUBSCRIPTION_EXPIRED]: "School subscription has expired",
  [ERROR_CODES.SCHOOL_SUBSCRIPTION_SUSPENDED]: "School subscription is suspended. Please contact support.",
  [ERROR_CODES.SCHOOL_SUBSCRIPTION_TRIAL_EXPIRED]: "School trial period has expired. Please purchase a subscription.",

  [ERROR_CODES.SUBJECT_ALREADY_EXISTS]: "Subject already exists",
  [ERROR_CODES.SUBJECT_NOT_FOUND]: "Subject not found",

  [ERROR_CODES.VALIDATION_ERROR]: "Validation error",
  [ERROR_CODES.REQUIRED_FIELD_MISSING]: "Required field is missing",
  [ERROR_CODES.INVALID_INPUT]: "Invalid input provided",
  [ERROR_CODES.DUPLICATE_RESOURCE]: "A resource with this value already exists",

  [ERROR_CODES.INTERNAL_ERROR]: "Internal server error",
  [ERROR_CODES.DATABASE_ERROR]: "Database operation failed",
  [ERROR_CODES.RESOURCE_NOT_FOUND]: "Requested resource not found",
  [ERROR_CODES.FORBIDDEN]: "You do not have permission to perform this action",
  [ERROR_CODES.NOT_INCHARGE]: "Only the class incharge can perform this action",

  // [NEW] Attendance Validation Error Messages
  [ERROR_CODES.NOT_A_SCHOOL_DAY]: "Attendance cannot be marked on holidays",
  [ERROR_CODES.SUNDAY_ATTENDANCE_NOT_ALLOWED]: "Attendance cannot be marked on Sundays",
};

const EXAM_TYPES = [
  "Class Test",
  "Unit Test",
  "Half Yearly",
  "Annual",
  "Final",
];

module.exports = {
  ROLES,
  USER_STATUS,
  SUBSCRIPTION_STATUS,
  HTTP_STATUS,
  ERROR_CODES,
  ERROR_MESSAGES,
  EXAM_TYPES,
};
