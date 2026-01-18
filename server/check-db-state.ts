import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabaseState() {
  console.log('\n🔍 בודק מצב מסד נתונים...\n');

  try {
    const users = await prisma.user.count();
    const ads = await prisma.ad.count();
    const cities = await prisma.city.count();
    const streets = await prisma.street.count();
    const categories = await prisma.category.count();
    const appointments = await prisma.appointment.count();
    const userAudits = await prisma.userAudit.count();

    console.log('📊 סטטיסטיקות נתונים:');
    console.log(`   👥 משתמשים: ${users}`);
    console.log(`   📝 מודעות: ${ads}`);
    console.log(`   🏙️  ערים: ${cities}`);
    console.log(`   🛣️  רחובות: ${streets}`);
    console.log(`   📂 קטגוריות: ${categories}`);
    console.log(`   📅 תורים: ${appointments}`);
    console.log(`   📋 רישומי ביקורת: ${userAudits}`);

    console.log('\n');
    
    if (users === 0 && ads === 0 && cities === 0) {
      console.log('❌ מסד הנתונים ריק לחלוטין! השחזור נכשל.');
      console.log('💡 יש להפעיל את תהליך השחזור שוב עם הגיבוי שנוצר.');
    } else if (users > 0 && cities > 0) {
      console.log('✅ יש נתונים במסד הנתונים. המערכת תקינה.');
    } else {
      console.log('⚠️  יש נתונים חלקיים. יכול להיות שהשחזור הצליח חלקית.');
    }

  } catch (error) {
    console.error('❌ שגיאה בבדיקת מסד נתונים:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseState();
