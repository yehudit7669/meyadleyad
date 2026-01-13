import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAds() {
  try {
    const count = await prisma.ad.count();
    console.log(`📊 סה"כ מודעות במערכת: ${count}`);
    
    if (count > 0) {
      const ads = await prisma.ad.findMany({
        take: 5,
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
        }
      });
      console.log('\n📝 דוגמאות למודעות:');
      ads.forEach(ad => {
        console.log(`  - ${ad.title} (${ad.status})`);
      });
    }
  } catch (error) {
    console.error('❌ שגיאה:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAds();
