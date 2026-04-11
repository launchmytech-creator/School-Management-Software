const fs = require("fs");
const path = require("path");
const pool = require("../database/connection");
const run = async () => {
  try {
    const filePath = path.join(__dirname, "../database/migrations/003_add_class_incharge.sql");
    const sql = fs.readFileSync(filePath, "utf8");
    console.log("Running migration 003: Add Class Incharge...");
    await pool.query(sql);
    console.log("✓ Migration 003 completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("✗ Migration 003 failed:", error.message);
    process.exit(1);
  }
};
run();