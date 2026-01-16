import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function ensureAdminUsers() {
  const admins = [
    {
      email: 'admin@meyadleyad.com',
      password: 'admin123456',
      name: 'Admin',
      role: UserRole.ADMIN,
    },
    {
      email: 'superadmin@meyadleyad.com',
      password: 'Admin123!@#',
      name: 'Super Admin',
      role: UserRole.SUPER_ADMIN,
    },
  ];

  for (const admin of admins) {
    const existing = await prisma.user.findUnique({
      where: { email: admin.email },
    });

    if (existing) {
      console.log(`✅ ${admin.name} כבר קיים:`, admin.email);
      
      // Update role and status if needed
      if (existing.role !== admin.role || existing.status !== UserStatus.ACTIVE) {
        await prisma.user.update({
          where: { email: admin.email },
          data: {
            role: admin.role,
            status: UserStatus.ACTIVE,
            isVerified: true,
            isEmailVerified: true,
          },
        });
        console.log(`  ✓ עודכן ל-${admin.role}`);
      }
    } else {
      // Hash password
      const hashedPassword = await bcrypt.hash(admin.password, 10);

      // Create admin
      await prisma.user.create({
        data: {
          email: admin.email,
          password: hashedPassword,
          name: admin.name,
          role: admin.role,
          status: UserStatus.ACTIVE,
          isVerified: true,
          isEmailVerified: true,
        },
      });

      console.log(`✅ ${admin.name} נוצר בהצלחה!`);
      console.log(`   📧 Email: ${admin.email}`);
      console.log(`   🔑 Password: ${admin.password}`);
    }
  }

  console.log('\n📋 סיכום משתמשי מנהל:');
  const allAdmins = await prisma.user.findMany({
    where: {
      role: {
        in: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR],
      },
    },
    select: {
      email: true,
      name: true,
      role: true,
      status: true,
    },
  });

  allAdmins.forEach((admin) => {
    console.log(`  - ${admin.name} (${admin.email}) - ${admin.role} - ${admin.status}`);
  });
}

ensureAdminUsers()
  .then(() => {
    console.log('\n✅ הושלם!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ שגיאה:', error);
    process.exit(1);
  });
