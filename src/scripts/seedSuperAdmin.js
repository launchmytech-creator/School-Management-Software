const bcrypt = require("bcryptjs");
const pool = require("../database/connection");
const config = require("../config");
const { ROLES } = require("../constants");

const seedSuperAdmin = async () => {
  try {
    console.log("Starting Super Admin seeding...");

    // Check if super admin already exists
    const checkQuery = "SELECT * FROM users WHERE role = $1";
    const checkResult = await pool.query(checkQuery, [ROLES.SUPER_ADMIN]);

    if (checkResult.rows.length > 0) {
      console.log("✓ Super Admin already exists");
      console.log("Email:", checkResult.rows[0].email);
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(config.superAdmin.password, 10);

    // Insert super admin
    const insertQuery = `
      INSERT INTO users (role, email, password_hash, full_name, is_active)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, full_name, role
    `;

    const result = await pool.query(insertQuery, [
      ROLES.SUPER_ADMIN,
      config.superAdmin.email,
      hashedPassword,
      config.superAdmin.name,
      true,
    ]);

    console.log("✓ Super Admin created successfully");
    console.log("-----------------------------------");
    console.log("Email:", result.rows[0].email);
    console.log("Password:", config.superAdmin.password);
    console.log("-----------------------------------");
    console.log("⚠️  Please change the password after first login!");

    process.exit(0);
  } catch (error) {
    console.error("✗ Error seeding Super Admin:", error);
    process.exit(1);
  }
};

seedSuperAdmin();
