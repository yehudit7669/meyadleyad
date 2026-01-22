const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Read DATABASE_URL from .env
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  try {
    const migrationPath = path.join(__dirname, 'prisma', 'migrations', '20260122000000_add_email_permissions', 'migration.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Running migration: add_email_permissions...');
    await pool.query(sql);
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
