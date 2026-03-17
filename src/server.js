const app = require("./app");
const config = require("./config");
const pool = require("./database/connection");
const logger = require("./utils/logger");

const startServer = async () => {
  try {
    // Test database connection
    await pool.query("SELECT NOW()");
    logger.info("Database connection established");

    // Start server
    app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
      logger.info(`Environment: ${config.env}`);
      logger.info(
        `API Base URL: http://localhost:${config.port}${config.api.prefix}`,
      );
    });
  } catch (error) {
    logger.error("Failed to start server", {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  logger.error("Unhandled Rejection", { error: err.message, stack: err.stack });
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception", { error: err.message, stack: err.stack });
  process.exit(1);
});

startServer();
