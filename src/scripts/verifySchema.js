const pool = require("../database/connection");
const logger = require("../utils/logger");

const verifySchema = async () => {
  try {
    console.log("Verifying database schema...\n");

    // Check users table columns
    const usersColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);

    console.log("✓ Users table columns:");
    usersColumns.rows.forEach((col) => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });

    // Check if super admin exists
    const superAdmin = await pool.query(`
      SELECT id, email, role, is_active, created_at
      FROM users
      WHERE role = 'super_admin'
      LIMIT 1;
    `);

    if (superAdmin.rows.length > 0) {
      console.log("\n✓ Super Admin found:");
      console.log(`  Email: ${superAdmin.rows[0].email}`);
      console.log(`  Active: ${superAdmin.rows[0].is_active}`);
      console.log(`  Created: ${superAdmin.rows[0].created_at}`);
    } else {
      console.log("\n⚠ No super admin found. Run: npm run seed:superadmin");
    }

    console.log("\n✓ Schema verification complete!");
    process.exit(0);
  } catch (error) {
    console.error("✗ Verification failed:", error.message);
    process.exit(1);
  }
};

verifySchema();
