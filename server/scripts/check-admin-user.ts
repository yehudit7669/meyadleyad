import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAdminUser() {
  const email = 'admin@meyadleyad.com';
  
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      isVerified: true,
      isEmailVerified: true,
    },
  });

  if (user) {
    console.log('✅ משתמש נמצא:');
    console.log(JSON.stringify(user, null, 2));
  } else {
    console.log('❌ משתמש לא נמצא:', email);
  }

  // Check also superadmin
  const superadmin = await prisma.user.findUnique({
    where: { email: 'superadmin@meyadleyad.com' },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
    },
  });

  if (superadmin) {
    console.log('\n✅ Super Admin נמצא:');
    console.log(JSON.stringify(superadmin, null, 2));
  }
}

checkAdminUser()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
