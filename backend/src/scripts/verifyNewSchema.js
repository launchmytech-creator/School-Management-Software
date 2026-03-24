const pool = require("../database/connection");

const verifySchema = async () => {
  try {
    console.log("🔍 Verifying database schema...\n");

    // Check all tables
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;

    const tablesResult = await pool.query(tablesQuery);
    console.log(`✅ Total Tables: ${tablesResult.rows.length}`);
    console.log("\n📋 Tables List:");
    tablesResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.table_name}`);
    });

    // Check subscription plans
    const plansQuery = "SELECT * FROM subscription_plans ORDER BY id;";
    const plansResult = await pool.query(plansQuery);
    console.log(`\n✅ Subscription Plans: ${plansResult.rows.length}`);
    plansResult.rows.forEach((plan) => {
      console.log(`   - ${plan.name}`);
    });

    // Check indexes
    const indexesQuery = `
      SELECT COUNT(*) as count 
      FROM pg_indexes 
      WHERE schemaname = 'public';
    `;
    const indexesResult = await pool.query(indexesQuery);
    console.log(`\n✅ Total Indexes: ${indexesResult.rows[0].count}`);

    // Check super admin
    const superAdminQuery = `
      SELECT id, email, full_name, role, school_id 
      FROM users 
      WHERE role = 'super_admin';
    `;
    const superAdminResult = await pool.query(superAdminQuery);
    console.log(`\n✅ Super Admin Users: ${superAdminResult.rows.length}`);
    if (superAdminResult.rows.length > 0) {
      superAdminResult.rows.forEach((admin) => {
        console.log(`   - ${admin.full_name} (${admin.email})`);
        console.log(
          `     Role: ${admin.role}, School ID: ${admin.school_id || "NULL (Platform Admin)"}`,
        );
      });
    }

    // Check multi-tenancy (school_id columns)
    const schoolIdQuery = `
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND column_name = 'school_id'
      ORDER BY table_name;
    `;
    const schoolIdResult = await pool.query(schoolIdQuery);
    console.log(
      `\n✅ Tables with school_id (Multi-tenant): ${schoolIdResult.rows.length}`,
    );
    schoolIdResult.rows.forEach((row) => {
      console.log(`   - ${row.table_name}`);
    });

    // Check unique constraints
    const constraintsQuery = `
      SELECT COUNT(*) as count
      FROM information_schema.table_constraints
      WHERE table_schema = 'public'
      AND constraint_type = 'UNIQUE';
    `;
    const constraintsResult = await pool.query(constraintsQuery);
    console.log(`\n✅ Unique Constraints: ${constraintsResult.rows[0].count}`);

    // Check foreign keys
    const fkQuery = `
      SELECT COUNT(*) as count
      FROM information_schema.table_constraints
      WHERE table_schema = 'public'
      AND constraint_type = 'FOREIGN KEY';
    `;
    const fkResult = await pool.query(fkQuery);
    console.log(`✅ Foreign Keys: ${fkResult.rows[0].count}`);

    console.log("\n" + "=".repeat(50));
    console.log("✅ SCHEMA VERIFICATION COMPLETE");
    console.log("=".repeat(50));
    console.log("\n🎯 Database is ready for use!");
    console.log("\n📝 Next steps:");
    console.log("   1. Start the server: npm start");
    console.log("   2. Login as super admin: superadmin@system.com");
    console.log("   3. Create your first school");
    console.log("   4. Test the API endpoints\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Verification failed:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

verifySchema();
