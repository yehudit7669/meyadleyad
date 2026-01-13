import prisma from './src/config/database';

async function checkUserEmail() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'yehudit7669@gmail.com' },
      select: {
        id: true,
        name: true,
        email: true,
        isEmailVerified: true,
        role: true,
      },
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('\n👤 User Details:');
    console.log('Name:', user.name);
    console.log('Email:', user.email);
    console.log('✉️  Email Verified:', user.isEmailVerified ? '✅ YES' : '❌ NO');
    console.log('Role:', user.role);
    console.log('');

    if (!user.isEmailVerified) {
      console.log('⚠️  Email is NOT verified!');
      console.log('📧 Please check your email for verification link');
      console.log('');
      console.log('💡 Or verify manually with this command:');
      console.log(`   UPDATE "User" SET "isEmailVerified" = true WHERE email = 'yehudit7669@gmail.com';`);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserEmail();
