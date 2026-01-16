import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const newPassword = 'Admin123!@#';
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const updated = await prisma.user.update({
    where: { email: 'superadmin@meyadleyad.com' },
    data: { 
      password: hashedPassword,
      isVerified: true,
      isEmailVerified: true,
    },
  });

  console.log('✅ Super Admin password reset successfully!');
  console.log('📧 Email:', updated.email);
  console.log('🔑 New Password:', newPassword);
  console.log('👤 Role:', updated.role);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
