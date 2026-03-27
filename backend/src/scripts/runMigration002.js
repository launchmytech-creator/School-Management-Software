const fs = require("fs");
const path = require("path");
const pool = require("../database/connection");

const run = async () => {
  try {
    const filePath = path.join(__dirname, "../database/migrations/002_fee_structure_redesign.sql");
    const sql = fs.readFileSync(filePath, "utf8");

    console.log("Running migration 002: Fee Structure Redesign...");
    await pool.query(sql);
    console.log("✓ Migration 002 completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("✗ Migration 002 failed:", error.message);
    process.exit(1);
  }
};

run();
