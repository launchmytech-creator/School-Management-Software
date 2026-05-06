const fs = require('fs');
const path = require('path');
const pool = require('../database/connection');

const runMigration = async () => {
  try {
    console.log('Running migration: 006_subscription_enhancements.sql...');

    const migrationsDir = path.join(__dirname, '../database/migrations');
    const filePath = path.join(migrationsDir, '006_subscription_enhancements.sql');
    const sql = fs.readFileSync(filePath, 'utf8');

    await pool.query(sql);

    console.log('✓ Migration 006_subscription_enhancements.sql completed');
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration 006 failed:', error.message);
    process.exit(1);
  }
};

runMigration();
