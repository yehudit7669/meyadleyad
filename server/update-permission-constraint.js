const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateConstraint() {
  try {
    console.log('Dropping old constraint...');
    await prisma.$executeRawUnsafe(
      `ALTER TABLE email_permissions DROP CONSTRAINT IF EXISTS check_permission_type`
    );
    
    console.log('Adding new constraint with publish_without_approval and manage_branding...');
    await prisma.$executeRawUnsafe(
      `ALTER TABLE email_permissions ADD CONSTRAINT check_permission_type CHECK (permission_type IN ('publish_without_approval', 'manage_branding', 'export_users', 'export_ads', 'export_stats', 'export_mailing_list', 'download_audit_log'))`
    );
    
    console.log('✅ Constraint updated successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

updateConstraint();
