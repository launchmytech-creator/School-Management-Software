const pool = require("../database/connection");
const fs = require("fs");
const path = require("path");

const compareSchema = async () => {
  try {
    console.log("🔍 Comparing schema file with actual database...\n");

    // Get all tables from database
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    const tablesResult = await pool.query(tablesQuery);
    const actualTables = tablesResult.rows.map((r) => r.table_name);

    console.log("📊 Tables in Database:", actualTables.length);
    actualTables.forEach((t) => console.log(`  ✓ ${t}`));

    // Expected tables from schema
    const expectedTables = [
      "schools",
      "users",
      "academic_years",
      "classes",
      "subjects",
      "class_subjects",
      "students",
      "student_subjects",
      "student_attendance",
      "teacher_attendance",
      "fee_structures",
      "fee_transactions",
      "exams",
      "exam_subjects",
      "exam_results",
      "announcements",
      "notifications",
    ];

    console.log("\n📋 Expected Tables:", expectedTables.length);

    // Check missing tables
    const missingTables = expectedTables.filter(
      (t) => !actualTables.includes(t),
    );
    if (missingTables.length > 0) {
      console.log("\n❌ Missing Tables:");
      missingTables.forEach((t) => console.log(`  ✗ ${t}`));
    } else {
      console.log("\n✅ All expected tables exist!");
    }

    // Check extra tables
    const extraTables = actualTables.filter((t) => !expectedTables.includes(t));
    if (extraTables.length > 0) {
      console.log("\n⚠️  Extra Tables (not in schema file):");
      extraTables.forEach((t) => console.log(`  • ${t}`));
    }

    // Check each table's columns
    console.log("\n🔍 Checking table columns...\n");

    for (const table of expectedTables) {
      if (!actualTables.includes(table)) continue;

      const columnsQuery = `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position;
      `;
      const columnsResult = await pool.query(columnsQuery, [table]);

      console.log(
        `📋 ${table.toUpperCase()} (${columnsResult.rows.length} columns):`,
      );
      columnsResult.rows.forEach((col) => {
        const nullable = col.is_nullable === "YES" ? "NULL" : "NOT NULL";
        const defaultVal = col.column_default
          ? ` DEFAULT ${col.column_default}`
          : "";
        console.log(
          `  • ${col.column_name} (${col.data_type}) ${nullable}${defaultVal}`,
        );
      });
      console.log("");
    }

    // Check foreign keys
    console.log("🔗 Checking Foreign Key Relationships...\n");

    const fkQuery = `
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.delete_rule
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      JOIN information_schema.referential_constraints AS rc
        ON rc.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      ORDER BY tc.table_name, kcu.column_name;
    `;

    const fkResult = await pool.query(fkQuery);

    fkResult.rows.forEach((fk) => {
      console.log(
        `  ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name} (ON DELETE ${fk.delete_rule})`,
      );
    });

    console.log(`\n✅ Total Foreign Keys: ${fkResult.rows.length}`);

    // Check indexes
    console.log("\n📇 Checking Indexes...\n");

    const indexQuery = `
      SELECT
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND tablename IN (${expectedTables.map((_, i) => `$${i + 1}`).join(",")})
      ORDER BY tablename, indexname;
    `;

    const indexResult = await pool.query(indexQuery, expectedTables);

    let currentTable = "";
    indexResult.rows.forEach((idx) => {
      if (idx.tablename !== currentTable) {
        console.log(`\n${idx.tablename}:`);
        currentTable = idx.tablename;
      }
      console.log(`  • ${idx.indexname}`);
    });

    console.log(`\n✅ Total Indexes: ${indexResult.rows.length}`);

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 SCHEMA COMPARISON SUMMARY");
    console.log("=".repeat(60));
    console.log(`Expected Tables: ${expectedTables.length}`);
    console.log(`Actual Tables: ${actualTables.length}`);
    console.log(`Missing Tables: ${missingTables.length}`);
    console.log(`Foreign Keys: ${fkResult.rows.length}`);
    console.log(`Indexes: ${indexResult.rows.length}`);

    if (missingTables.length === 0) {
      console.log("\n✅ Schema is COMPLETE and matches the documentation!");
    } else {
      console.log("\n⚠️  Schema has missing tables. Run migrations to fix.");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

compareSchema();
