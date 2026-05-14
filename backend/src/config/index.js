require("dotenv").config();

const config = {
  env: process.env.NODE_ENV || "development",
  port: process.env.PORT || 3000,

  database: {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || "school_management",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "",
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",
    resetTokenExpiresIn: process.env.JWT_RESET_TOKEN_EXPIRES_IN || "1h",
  },

  superAdmin: {
    email: process.env.SUPER_ADMIN_EMAIL,
    password: process.env.SUPER_ADMIN_PASSWORD,
    name: process.env.SUPER_ADMIN_NAME || "Super Administrator",
  },

  // Validate required security configurations
  _validateSecurity: () => {
    const errors = [];
    if (!config.jwt.secret) {
      errors.push("JWT_SECRET environment variable is required");
    }
    if (!config.superAdmin.email) {
      errors.push("SUPER_ADMIN_EMAIL environment variable is required");
    }
    if (!config.superAdmin.password) {
      errors.push("SUPER_ADMIN_PASSWORD environment variable is required");
    }
    if (config.env === "production" && errors.length > 0) {
      throw new Error(`Production configuration errors: ${errors.join(", ")}`);
    }
  },

  api: {
    prefix: process.env.API_PREFIX || "/api/v1",
  },

  email: {
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT || "587"),
    secure: process.env.EMAIL_SECURE === "true", // true for 465 (SSL), false for 587 (STARTTLS)
    user: process.env.EMAIL_USER || "",
    password: process.env.EMAIL_PASSWORD || "",
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER || "",
    fromName: process.env.EMAIL_FROM_NAME || "School Management System",
  },
};

// Validate security configurations in production
config._validateSecurity();

module.exports = config;
