const fs = require('fs');
const path = require('path');
const pool = require('../database/connection');

const runMigration = async () => {
  try {
    console.log('Running migration: 005_password_reset_tokens.sql...');

    const migrationsDir = path.join(__dirname, '../database/migrations');
    const filePath = path.join(migrationsDir, '005_password_reset_tokens.sql');
    const sql = fs.readFileSync(filePath, 'utf8');

    await pool.query(sql);

    console.log('✓ Migration 005_password_reset_tokens.sql completed');
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration 005 failed:', error.message);
    process.exit(1);
  }
};

runMigration();
