const fs = require("fs");
const path = require("path");
const pool = require("../database/connection");
const logger = require("../utils/logger");

const resetDatabase = async () => {
  const client = await pool.connect();

  try {
    console.log("🔄 Starting database reset...");

    // Start transaction
    await client.query("BEGIN");

    // Drop all tables in reverse order of dependencies
    console.log("🗑️  Dropping existing tables...");

    const dropTablesSQL = `
      -- Drop all tables if they exist
      DROP TABLE IF EXISTS audit_logs CASCADE;
      DROP TABLE IF EXISTS announcements CASCADE;
      DROP TABLE IF EXISTS notifications CASCADE;
      DROP TABLE IF EXISTS exam_results CASCADE;
      DROP TABLE IF EXISTS exam_subjects CASCADE;
      DROP TABLE IF EXISTS exams CASCADE;
      DROP TABLE IF EXISTS fee_transactions CASCADE;
      DROP TABLE IF EXISTS fee_structures CASCADE;
      DROP TABLE IF EXISTS holidays CASCADE;
      DROP TABLE IF EXISTS teacher_attendance CASCADE;
      DROP TABLE IF EXISTS student_attendance CASCADE;
      DROP TABLE IF EXISTS student_promotions CASCADE;
      DROP TABLE IF EXISTS students CASCADE;
      DROP TABLE IF EXISTS syllabus_completion CASCADE;
      DROP TABLE IF EXISTS teacher_allocations CASCADE;
      DROP TABLE IF EXISTS class_subjects CASCADE;
      DROP TABLE IF EXISTS chapters CASCADE;
      DROP TABLE IF EXISTS subjects CASCADE;
      DROP TABLE IF EXISTS classes CASCADE;
      DROP TABLE IF EXISTS academic_years CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS fee_terms_history CASCADE;
      DROP TABLE IF EXISTS subscription_history CASCADE;
      DROP TABLE IF EXISTS schools CASCADE;
      DROP TABLE IF EXISTS subscription_plans CASCADE;
    `;

    await client.query(dropTablesSQL);
    console.log("✓ All existing tables dropped");

    // Read and execute the new schema
    console.log("📝 Applying new schema...");

    const schemaPath = path.join(
      __dirname,
      "../database/migrations/001_complete_schema.sql",
    );
    const schemaSql = fs.readFileSync(schemaPath, "utf8");

    await client.query(schemaSql);
    console.log("✓ New schema applied successfully");

    // Commit transaction
    await client.query("COMMIT");

    console.log("✅ Database reset completed successfully!");
    console.log("\n📊 Schema Summary:");
    console.log("   - 25 tables created");
    console.log("   - 3 subscription plans inserted");
    console.log("   - All indexes created");
    console.log("   - Multi-tenant isolation enabled");
    console.log("\n🎯 Next steps:");
    console.log("   1. Run: npm run seed:superadmin (to create super admin)");
    console.log("   2. Start the server: npm start");

    process.exit(0);
  } catch (error) {
    // Rollback on error
    await client.query("ROLLBACK");
    console.error("❌ Database reset failed:", error.message);
    console.error("Stack:", error.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
};

// Run the reset
resetDatabase();
