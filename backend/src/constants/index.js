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

  // User Errors
  USER_NOT_FOUND: "USER_001",
  USER_ALREADY_EXISTS: "USER_002",
  USER_INACTIVE: "USER_003",

  // School Errors
  SCHOOL_NOT_FOUND: "SCHOOL_001",
  SCHOOL_INACTIVE: "SCHOOL_002",
  SCHOOL_SUBSCRIPTION_EXPIRED: "SCHOOL_003",

  // Validation Errors
  VALIDATION_ERROR: "VAL_001",
  REQUIRED_FIELD_MISSING: "VAL_002",
  INVALID_INPUT: "VAL_003",

  // General Errors
  INTERNAL_ERROR: "SYS_001",
  DATABASE_ERROR: "SYS_002",
  RESOURCE_NOT_FOUND: "SYS_003",
};

const ERROR_MESSAGES = {
  [ERROR_CODES.AUTH_INVALID_CREDENTIALS]: "Invalid email or password",
  [ERROR_CODES.AUTH_TOKEN_MISSING]: "Authentication token is missing",
  [ERROR_CODES.AUTH_TOKEN_INVALID]: "Invalid authentication token",
  [ERROR_CODES.AUTH_TOKEN_EXPIRED]: "Authentication token has expired",
  [ERROR_CODES.AUTH_UNAUTHORIZED]:
    "You are not authorized to perform this action",

  [ERROR_CODES.USER_NOT_FOUND]: "User not found",
  [ERROR_CODES.USER_ALREADY_EXISTS]: "User with this email already exists",
  [ERROR_CODES.USER_INACTIVE]: "User account is inactive",

  [ERROR_CODES.SCHOOL_NOT_FOUND]: "School not found",
  [ERROR_CODES.SCHOOL_INACTIVE]: "School is inactive",
  [ERROR_CODES.SCHOOL_SUBSCRIPTION_EXPIRED]: "School subscription has expired",

  [ERROR_CODES.VALIDATION_ERROR]: "Validation error",
  [ERROR_CODES.REQUIRED_FIELD_MISSING]: "Required field is missing",
  [ERROR_CODES.INVALID_INPUT]: "Invalid input provided",

  [ERROR_CODES.INTERNAL_ERROR]: "Internal server error",
  [ERROR_CODES.DATABASE_ERROR]: "Database operation failed",
  [ERROR_CODES.RESOURCE_NOT_FOUND]: "Requested resource not found",
};

module.exports = {
  ROLES,
  USER_STATUS,
  SUBSCRIPTION_STATUS,
  HTTP_STATUS,
  ERROR_CODES,
  ERROR_MESSAGES,
};
