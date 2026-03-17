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
    secret: process.env.JWT_SECRET || "your_jwt_secret_key",
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",
  },

  superAdmin: {
    email: process.env.SUPER_ADMIN_EMAIL || "superadmin@system.com",
    password: process.env.SUPER_ADMIN_PASSWORD || "SuperAdmin@123",
    name: process.env.SUPER_ADMIN_NAME || "Super Administrator",
  },

  api: {
    prefix: process.env.API_PREFIX || "/api/v1",
  },
};

module.exports = config;
