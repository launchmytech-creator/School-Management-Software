const { Pool, types } = require("pg");
const config = require("../config");
const logger = require("../utils/logger");

// Return DATE columns as plain strings (YYYY-MM-DD) instead of JS Date objects
// This prevents UTC timezone shift (e.g. 2026-03-25 becoming 2026-03-24T18:30:00Z in IST)
types.setTypeParser(1082, (val) => val);

const poolConfig = {
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000, // Increased to 10 seconds
};

// Add SSL configuration if enabled
if (config.database.ssl) {
  poolConfig.ssl = {
    rejectUnauthorized: false,
  };
}

const pool = new Pool(poolConfig);

pool.on("connect", () => {
  logger.info("Database connected successfully");
});

pool.on("error", (err) => {
  logger.error("Unexpected database error", {
    error: err.message,
    stack: err.stack,
  });
});

module.exports = pool;
