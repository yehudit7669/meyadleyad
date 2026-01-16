import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createSuperAdmin() {
  const email = 'superadmin@meyadleyad.com';
  const password = 'Admin123!@#';
  
  // Check if user exists
  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    console.log('✅ Super Admin already exists:', email);
    
    // Update role to SUPER_ADMIN if needed
    if (existing.role !== UserRole.SUPER_ADMIN) {
      await prisma.user.update({
        where: { email },
        data: {
          role: UserRole.SUPER_ADMIN,
          status: UserStatus.ACTIVE,
        },
      });
      console.log('✅ Updated user to SUPER_ADMIN');
    }
    
    return;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create super admin
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name: 'Super Admin',
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      isVerified: true,
      isEmailVerified: true,
    },
  });

  console.log('✅ Super Admin created successfully!');
  console.log('📧 Email:', email);
  console.log('🔑 Password:', password);
  console.log('⚠️  Change this password after first login!');
}

createSuperAdmin()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
