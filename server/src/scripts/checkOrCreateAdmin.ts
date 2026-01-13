import prisma from '../config/database';
import bcrypt from 'bcryptjs';

async function checkOrCreateAdmin() {
  try {
    console.log('🔍 בודק אם קיים משתמש אדמין במערכת...\n');

    // חיפוש משתמש אדמין קיים
    const existingAdmin = await prisma.user.findFirst({
      where: {
        role: 'ADMIN',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    if (existingAdmin) {
      console.log('✅ נמצא משתמש אדמין קיים במערכת!\n');
      console.log('📧 אימייל האדמין:', existingAdmin.email);
      console.log('👤 שם:', existingAdmin.name || 'לא הוגדר');
      console.log('📅 נוצר בתאריך:', existingAdmin.createdAt.toLocaleDateString('he-IL'));
      console.log('\n' + '='.repeat(60));
      console.log('🔐 איך להתחבר:');
      console.log('='.repeat(60));
      console.log('1. היכנס לדף ההתחברות: http://localhost:3000/login');
      console.log('2. הזן את כתובת האימייל:', existingAdmin.email);
      console.log('3. הזן את הסיסמה שהגדרת בעבר');
      console.log('4. לחץ על "התחבר"');
      console.log('5. לאחר ההתחברות, גש לדף הניהול: http://localhost:3000/admin');
      console.log('='.repeat(60));
    } else {
      console.log('⚠️  לא נמצא משתמש אדמין במערכת!');
      console.log('🔨 יוצר משתמש אדמין חדש...\n');

      // יצירת סיסמה מוצפנת
      const hashedPassword = await bcrypt.hash('Admin123!', 10);

      // יצירת משתמש אדמין חדש
      const newAdmin = await prisma.user.create({
        data: {
          email: 'admin@example.com',
          password: hashedPassword,
          name: 'מנהל מערכת',
          role: 'ADMIN',
          isVerified: true,
          isEmailVerified: true,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });

      console.log('✅ משתמש אדמין נוצר בהצלחה!\n');
      console.log('📧 אימייל:', newAdmin.email);
      console.log('🔑 סיסמה:', 'Admin123!');
      console.log('👤 שם:', newAdmin.name);
      console.log('📅 נוצר עכשיו:', newAdmin.createdAt.toLocaleDateString('he-IL'));
      console.log('\n' + '='.repeat(60));
      console.log('🔐 איך להתחבר:');
      console.log('='.repeat(60));
      console.log('1. היכנס לדף ההתחברות: http://localhost:3000/login');
      console.log('2. הזן את האימייל: admin@example.com');
      console.log('3. הזן את הסיסמה: Admin123!');
      console.log('4. לחץ על "התחבר"');
      console.log('5. לאחר ההתחברות, גש לדף הניהול: http://localhost:3000/admin');
      console.log('\n⚠️  חשוב! שנה את הסיסמה אחרי הכניסה הראשונה!');
      console.log('='.repeat(60));
    }

    // ספירת כל המשתמשים לפי תפקיד
    const userCounts = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        role: true,
      },
    });

    console.log('\n📊 סטטיסטיקות משתמשים במערכת:');
    console.log('='.repeat(60));
    userCounts.forEach((count) => {
      const roleNames: Record<string, string> = {
        ADMIN: 'מנהלי מערכת',
        BROKER: 'מתווכים',
        USER: 'משתמשים רגילים',
      };
      console.log(`${roleNames[count.role] || count.role}: ${count._count.role}`);
    });
    console.log('='.repeat(60));

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ שגיאה:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkOrCreateAdmin();
