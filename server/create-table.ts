import { prisma } from './src/config/database';

async function createTable() {
  try {
    console.log('Creating email_permissions table...');
    
    await prisma.$executeRaw`
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
      )
    `;
    
    console.log('✅ Table created!');
    
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_email_permissions_email ON email_permissions(email)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_email_permissions_active ON email_permissions(is_active)`;
    
    console.log('✅ Indexes created!');
    console.log('✅ Migration completed successfully!');
    
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

createTable();
