import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('🔧 Creating temporary admin user...\n');

    const email = 'admin@meyadleyad.com';
    const password = 'Admin123!'; // סיסמה זמנית - תשני אותה אחרי ההתחברות

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // בדוק אם המשתמש כבר קיים
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      // עדכן את הסיסמה והרשאות
      await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          role: 'SUPER_ADMIN',
          isVerified: true,
          isEmailVerified: true,
          status: 'ACTIVE'
        }
      });
      
      console.log('✅ Admin user password reset successfully!\n');
      console.log('📋 Login credentials:');
      console.log(`   📧 Email: ${email}`);
      console.log(`   🔑 Password: ${password}`);
      console.log('\n🚀 You can now login at:', config.clientUrl + '/login\n');
      return;
    }

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: 'System Admin',
        role: 'SUPER_ADMIN',
        isVerified: true,
        isEmailVerified: true,
        userType: 'USER',
        termsAcceptedAt: new Date(),
        declarationAcceptedAt: new Date()
      }
    });

    console.log('✅ Temporary admin user created successfully!\n');
    console.log('📋 Login credentials:');
    console.log(`   📧 Email: ${email}`);
    console.log(`   🔑 Password: ${password}`);
    console.log('\n⚠️  IMPORTANT: Change this password after first login!\n');
    console.log('🚀 You can now login at:', config.clientUrl + '/login\n');

  } catch (error: any) {
    console.error('❌ Error creating admin user:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
