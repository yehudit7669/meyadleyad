import jwt from 'jsonwebtoken';
import { config } from '../src/config';
import prisma from '../src/config/database';

async function checkToken() {
  // קבלת Super Admin מהדאטהבייס
  const user = await prisma.user.findUnique({
    where: { email: 'superadmin@meyadleyad.com' },
    select: { 
      id: true, 
      email: true, 
      role: true,
      status: true,
      isVerified: true,
      isEmailVerified: true,
    },
  });

  if (!user) {
    console.log('❌ Super Admin not found');
    return;
  }

  console.log('✅ User from DB:', JSON.stringify(user, null, 2));

  // יצירת טוקן
  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  console.log('\n📝 Generated Token:', token);

  // פענוח הטוקן
  const decoded = jwt.verify(token, config.jwt.secret);
  console.log('\n🔓 Decoded Token:', JSON.stringify(decoded, null, 2));

  // בדיקת isAdmin
  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'MODERATOR';
  console.log('\n✨ isAdmin should be:', isAdmin);

  await prisma.$disconnect();
}

checkToken().catch(console.error);
