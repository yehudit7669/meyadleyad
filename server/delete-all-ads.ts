import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteAllAds() {
  try {
    console.log('🗑️  מוחק את כל המודעות...');

    // מחיקת כל הנתונים הקשורים למודעות
    await prisma.favorite.deleteMany({});
    console.log('✅ מחק favorites');

    await prisma.adView.deleteMany({});
    console.log('✅ מחק ad views');

    await prisma.appointment.deleteMany({});
    console.log('✅ מחק appointments');

    await prisma.adImage.deleteMany({});
    console.log('✅ מחק ad images');

    // מחיקת כל המודעות
    const result = await prisma.ad.deleteMany({});
    console.log(`✅ מחק ${result.count} מודעות`);

    console.log('✨ כל המודעות נמחקו בהצלחה!');
  } catch (error) {
    console.error('❌ שגיאה במחיקת מודעות:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllAds();
