import prisma from './config/database';

const migration = `
CREATE TABLE IF NOT EXISTS email_permissions (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  permission_type VARCHAR(100) NOT NULL,
  scope VARCHAR(20) NOT NULL DEFAULT 'one-time',
  expiry TIMESTAMP,
  admin_note TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255) NOT NULL,
  used_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  CONSTRAINT check_scope CHECK (scope IN ('one-time', 'permanent')),
  CONSTRAINT check_permission_type CHECK (permission_type IN ('export_users', 'export_ads', 'export_stats', 'export_mailing_list', 'download_audit_log'))
);
`;

const indexes = [
  `CREATE INDEX IF NOT EXISTS idx_email_permissions_email ON email_permissions(email);`,
  `CREATE INDEX IF NOT EXISTS idx_email_permissions_active ON email_permissions(is_active);`
];

async function runMigration() {
  try {
    console.log('Running migration: add_email_permissions...');
    
    await prisma.$executeRawUnsafe(migration);
    console.log('✅ Table created successfully!');
    
    for (const index of indexes) {
      await prisma.$executeRawUnsafe(index);
    }
    console.log('✅ Indexes created successfully!');
    
    console.log('✅ Migration completed successfully!');
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

runMigration();
