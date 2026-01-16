import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  console.log('🔍 בדיקת נתונים במערכת...\n');
  
  // Count all data
  const [users, ads, categories, cities, streets] = await Promise.all([
    prisma.user.count(),
    prisma.ad.count(),
    prisma.category.count(),
    prisma.city.count(),
    prisma.street.count(),
  ]);

  console.log('📊 סטטיסטיקות מערכת:');
  console.log(`  משתמשים: ${users}`);
  console.log(`  מודעות: ${ads}`);
  console.log(`  קטגוריות: ${categories}`);
  console.log(`  ערים: ${cities}`);
  console.log(`  רחובות: ${streets}\n`);

  if (ads === 0) {
    console.log('❌ אין מודעות במערכת - כל המודעות נמחקו!');
  } else {
    console.log(`✅ יש ${ads} מודעות במערכת`);
    
    // Show some recent ads
    const recentAds = await prisma.ad.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        User: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    console.log('\n📋 מודעות אחרונות:');
    recentAds.forEach((ad) => {
      console.log(`  - ${ad.title} (${ad.status}) - ${ad.User.name || ad.User.email}`);
    });
  }

  if (cities === 0) {
    console.log('\n❌ אין ערים במערכת');
  }

  if (streets === 0) {
    console.log('❌ אין רחובות במערכת');
  }
}

checkData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
