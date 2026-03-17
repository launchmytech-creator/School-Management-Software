const fs = require("fs");
const path = require("path");
const pool = require("../database/connection");

const runMigrations = async () => {
  try {
    console.log("Starting database migrations...");

    const migrationsDir = path.join(__dirname, "../database/migrations");
    const migrationFiles = fs.readdirSync(migrationsDir).sort();

    for (const file of migrationFiles) {
      if (file.endsWith(".sql")) {
        console.log(`Running migration: ${file}`);

        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, "utf8");

        await pool.query(sql);

        console.log(`✓ Migration ${file} completed`);
      }
    }

    console.log("✓ All migrations completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("✗ Migration failed:", error);
    process.exit(1);
  }
};

runMigrations();
